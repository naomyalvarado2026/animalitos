package org.adoptame.animalitos

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.os.SystemClock
import android.provider.Settings
import android.view.View
import android.webkit.CookieManager
import android.webkit.JsResult
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class MainActivity : AppCompatActivity() {

  private lateinit var rootContainer: FrameLayout
  private lateinit var swipeRefresh: SwipeRefreshLayout
  private lateinit var webView: WebView
  private lateinit var progressBar: ProgressBar
  private lateinit var offlineOverlay: LinearLayout
  private lateinit var retryButton: Button

  private val backgroundExecutor = Executors.newSingleThreadExecutor()
  private var networkCallback: ConnectivityManager.NetworkCallback? = null
  private var isNetworkCallbackRegistered = false

  @Volatile
  private var useBundledOfflineAssets = false
  private var offlineFallbackUsedForCurrentLoad = false
  private var hasCheckedApkUpdateThisSession = false
  private var pendingApkDownloadUrl: String? = null

  private var initialLoadDone = false
  private var hasMainFrameError = false
  private var lastAttemptedUrl = START_URL
  private var filePathCallback: ValueCallback<Array<Uri>>? = null

  private val fileChooserLauncher = registerForActivityResult(
    ActivityResultContracts.StartActivityForResult()
  ) { result ->
    val callback = filePathCallback
    filePathCallback = null
    if (callback != null) {
      val parsed = WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data)
      callback.onReceiveValue(parsed)
    }
  }

  private val installPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.StartActivityForResult()
  ) {
    val queuedUrl = pendingApkDownloadUrl
    if (queuedUrl != null && canInstallUnknownApps()) {
      pendingApkDownloadUrl = null
      downloadAndInstallApk(queuedUrl)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    val splashScreen = installSplashScreen()
    val startedAt = SystemClock.elapsedRealtime()
    splashScreen.setKeepOnScreenCondition {
      !initialLoadDone && (SystemClock.elapsedRealtime() - startedAt) < MAX_SPLASH_MS
    }

    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContentView(R.layout.activity_main)

    rootContainer = findViewById(R.id.rootContainer)
    swipeRefresh = findViewById(R.id.swipeRefresh)
    webView = findViewById(R.id.webView)
    progressBar = findViewById(R.id.progressBar)
    offlineOverlay = findViewById(R.id.offlineOverlay)
    retryButton = findViewById(R.id.retryButton)

    applySystemBarAppearance()
    applyWindowInsets()
    configureSwipeRefresh()
    configureWebView()
    configureBackNavigation()

    retryButton.setOnClickListener {
      hasMainFrameError = false
      offlineFallbackUsedForCurrentLoad = false
      useBundledOfflineAssets = !isNetworkAvailable() && !hasLoadedLiveOriginBefore()
      offlineOverlay.visibility = View.GONE
      webView.loadUrl(lastAttemptedUrl)
    }

    if (savedInstanceState != null) {
      webView.restoreState(savedInstanceState)
      initialLoadDone = true
    } else {
      val initialUrl = resolveStartUrl(intent)
      lastAttemptedUrl = initialUrl
      val onlineNow = isNetworkAvailable()
      useBundledOfflineAssets = !onlineNow && !hasLoadedLiveOriginBefore()
      webView.loadUrl(initialUrl)
      if (onlineNow) {
        maybeCheckGithubApkUpdate()
      }
    }
  }

  override fun onStart() {
    super.onStart()
    registerNetworkObserver()
    if (isNetworkAvailable()) {
      handleConnectivityRestored(triggerReloadIfBundled = useBundledOfflineAssets)
    }
  }

  override fun onStop() {
    unregisterNetworkObserver()
    super.onStop()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    val deepLink = resolveAuthCallback(intent.data)
    if (deepLink != null && isInternalAdoptameUrl(deepLink)) {
      val target = deepLink.toString()
      lastAttemptedUrl = target
      hasMainFrameError = false
      offlineFallbackUsedForCurrentLoad = false
      useBundledOfflineAssets = !isNetworkAvailable() && !hasLoadedLiveOriginBefore()
      offlineOverlay.visibility = View.GONE
      webView.loadUrl(target)
    }
  }

  override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    webView.saveState(outState)
  }

  override fun onDestroy() {
    unregisterNetworkObserver()
    backgroundExecutor.shutdownNow()
    filePathCallback?.onReceiveValue(null)
    filePathCallback = null
    webView.stopLoading()
    webView.destroy()
    super.onDestroy()
  }

  private fun applySystemBarAppearance() {
    val isDark = (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
      Configuration.UI_MODE_NIGHT_YES
    val controller = WindowInsetsControllerCompat(window, window.decorView)
    controller.isAppearanceLightStatusBars = !isDark
    controller.isAppearanceLightNavigationBars = !isDark
  }

  private fun applyWindowInsets() {
    ViewCompat.setOnApplyWindowInsetsListener(rootContainer) { view, insets ->
      val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
      view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
      insets
    }
  }

  private fun configureSwipeRefresh() {
    swipeRefresh.setColorSchemeColors(
      ContextCompat.getColor(this, R.color.adoptame_primary),
      ContextCompat.getColor(this, R.color.adoptame_accent)
    )
    swipeRefresh.setOnChildScrollUpCallback { _, _ -> webView.scrollY > 0 }
    swipeRefresh.setOnRefreshListener {
      if (isNetworkAvailable()) {
        useBundledOfflineAssets = false
      }
      if (offlineOverlay.visibility == View.VISIBLE) {
        hasMainFrameError = false
        webView.loadUrl(lastAttemptedUrl)
      } else {
        webView.reload()
      }
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun configureWebView() {
    if (BuildConfig.DEBUG) {
      WebView.setWebContentsDebuggingEnabled(true)
    }

    CookieManager.getInstance().apply {
      setAcceptCookie(true)
      setAcceptThirdPartyCookies(webView, true)
    }

    webView.settings.apply {
      javaScriptEnabled = true
      domStorageEnabled = true
      cacheMode = WebSettings.LOAD_DEFAULT
      mediaPlaybackRequiresUserGesture = false
      loadWithOverviewMode = true
      useWideViewPort = true
      setSupportMultipleWindows(true)
      allowFileAccess = false
      allowContentAccess = true
      mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        safeBrowsingEnabled = true
      }
      userAgentString = "$userAgentString AdoptaMEAndroid/${BuildConfig.VERSION_NAME}"
    }

    webView.webViewClient = object : WebViewClient() {
      override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
      ): WebResourceResponse? {
        if (!useBundledOfflineAssets || request == null) {
          return super.shouldInterceptRequest(view, request)
        }
        if (!request.method.equals("GET", ignoreCase = true)) {
          return super.shouldInterceptRequest(view, request)
        }
        val uri = request.url ?: return super.shouldInterceptRequest(view, request)
        if (!isInternalAdoptameUrl(uri)) {
          return super.shouldInterceptRequest(view, request)
        }
        return resolveBundledAssetResponse(uri) ?: super.shouldInterceptRequest(view, request)
      }

      override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val uri = request?.url ?: return false
        if (isInternalAdoptameUrl(uri)) {
          return false
        }
        openExternalUri(uri)
        return true
      }

      override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        super.onPageStarted(view, url, favicon)
        hasMainFrameError = false
        if (!url.isNullOrBlank()) {
          lastAttemptedUrl = url
        }
        progressBar.visibility = View.VISIBLE
      }

      override fun onPageFinished(view: WebView?, url: String?) {
        super.onPageFinished(view, url)
        initialLoadDone = true
        swipeRefresh.isRefreshing = false
        progressBar.visibility = View.GONE
        if (!hasMainFrameError) {
          offlineOverlay.visibility = View.GONE
          offlineFallbackUsedForCurrentLoad = false
          if (!useBundledOfflineAssets && isNetworkAvailable()) {
            markLiveOriginLoaded()
          }
        }
      }

      override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
      ) {
        super.onReceivedError(view, request, error)
        if (request?.isForMainFrame != true) return

        val failingUrl = request.url?.toString() ?: lastAttemptedUrl
        if (!useBundledOfflineAssets && !offlineFallbackUsedForCurrentLoad && hasBundledIndex()) {
          offlineFallbackUsedForCurrentLoad = true
          useBundledOfflineAssets = true
          hasMainFrameError = false
          lastAttemptedUrl = failingUrl
          webView.post { webView.loadUrl(failingUrl) }
          return
        }

        initialLoadDone = true
        hasMainFrameError = true
        swipeRefresh.isRefreshing = false
        progressBar.visibility = View.GONE
        lastAttemptedUrl = failingUrl
        offlineOverlay.visibility = View.VISIBLE
      }
    }

    webView.webChromeClient = object : WebChromeClient() {
      override fun onProgressChanged(view: WebView?, newProgress: Int) {
        progressBar.progress = newProgress
        progressBar.visibility = if (newProgress in 1..99) View.VISIBLE else View.GONE
      }

      override fun onCreateWindow(
        view: WebView?,
        isDialog: Boolean,
        isUserGesture: Boolean,
        resultMsg: Message?
      ): Boolean {
        val transport = resultMsg?.obj as? WebView.WebViewTransport ?: return false
        val tempWebView = WebView(this@MainActivity)
        var handled = false
        tempWebView.webViewClient = object : WebViewClient() {
          private fun handlePopupUri(uri: Uri?) {
            if (handled || uri == null) return
            handled = true
            if (isInternalAdoptameUrl(uri)) {
              webView.loadUrl(uri.toString())
            } else {
              openExternalUri(uri)
            }
            tempWebView.destroy()
          }

          override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            handlePopupUri(request?.url)
            return true
          }

          override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            handlePopupUri(url?.let(Uri::parse))
          }
        }
        transport.webView = tempWebView
        resultMsg.sendToTarget()
        return true
      }

      override fun onJsAlert(
        view: WebView?,
        url: String?,
        message: String?,
        result: JsResult?
      ): Boolean {
        AlertDialog.Builder(this@MainActivity)
          .setMessage(message.orEmpty())
          .setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }
          .setOnCancelListener { result?.cancel() }
          .show()
        return true
      }

      override fun onJsConfirm(
        view: WebView?,
        url: String?,
        message: String?,
        result: JsResult?
      ): Boolean {
        AlertDialog.Builder(this@MainActivity)
          .setMessage(message.orEmpty())
          .setPositiveButton(android.R.string.ok) { _, _ -> result?.confirm() }
          .setNegativeButton(android.R.string.cancel) { _, _ -> result?.cancel() }
          .setOnCancelListener { result?.cancel() }
          .show()
        return true
      }

      override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?
      ): Boolean {
        this@MainActivity.filePathCallback?.onReceiveValue(null)
        this@MainActivity.filePathCallback = filePathCallback

        val intent = runCatching { fileChooserParams?.createIntent() }.getOrNull()
        if (intent == null) {
          this@MainActivity.filePathCallback?.onReceiveValue(null)
          this@MainActivity.filePathCallback = null
          return false
        }

        val launched = runCatching {
          fileChooserLauncher.launch(intent)
        }.isSuccess
        if (!launched) {
          this@MainActivity.filePathCallback?.onReceiveValue(null)
          this@MainActivity.filePathCallback = null
          return false
        }
        return true
      }
    }

    webView.setDownloadListener { url, _, _, _, _ ->
      if (!url.isNullOrBlank()) {
        openExternalUri(Uri.parse(url))
      }
    }
  }

  private fun configureBackNavigation() {
    onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
      override fun handleOnBackPressed() {
        if (webView.canGoBack()) {
          webView.goBack()
        } else {
          isEnabled = false
          onBackPressedDispatcher.onBackPressed()
        }
      }
    })
  }

  private fun resolveStartUrl(intent: Intent?): String {
    val data = resolveAuthCallback(intent?.data)
    return if (data != null && isInternalAdoptameUrl(data)) data.toString() else START_URL
  }

  private fun isInternalAdoptameUrl(uri: Uri): Boolean {
    if (!uri.scheme.equals("https", ignoreCase = true)) return false
    if (!uri.host.equals(ALLOWED_HOST, ignoreCase = true)) return false
    val path = uri.path ?: return false
    return path == BASE_PATH || path.startsWith("$BASE_PATH/")
  }

  private fun resolveAuthCallback(uri: Uri?): Uri? {
    if (uri?.scheme != "adoptame" || uri.host != "auth" || uri.path != "/callback") return uri
    // Only return a one-use PKCE code; the verifier stays in the app's storage.
    val target = Uri.parse("https://$ALLOWED_HOST$BASE_PATH/admin/login").buildUpon()
    val code = uri.getQueryParameter("code")
    val error = uri.getQueryParameter("error")
    if (!code.isNullOrBlank()) target.appendQueryParameter("code", code)
    else target.appendQueryParameter("error", error ?: "oauth_cancelled")
    return target.build()
  }

  private fun openExternalUri(uri: Uri) {
    val scheme = uri.scheme?.lowercase() ?: return
    if (scheme !in ALLOWED_EXTERNAL_SCHEMES) return
    val launched = runCatching {
      startActivity(Intent(Intent.ACTION_VIEW, uri))
    }.isSuccess
    if (!launched) {
      Toast.makeText(this, R.string.external_link_error, Toast.LENGTH_SHORT).show()
    }
  }

  private fun prefs() = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  private fun hasLoadedLiveOriginBefore(): Boolean =
    prefs().getBoolean(KEY_HAS_LOADED_LIVE, false)

  private fun markLiveOriginLoaded() {
    prefs().edit().putBoolean(KEY_HAS_LOADED_LIVE, true).apply()
  }

  private fun isNetworkAvailable(): Boolean {
    val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
    val activeNetwork = cm.activeNetwork ?: return false
    val capabilities = cm.getNetworkCapabilities(activeNetwork) ?: return false
    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
      capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
  }

  private fun registerNetworkObserver() {
    if (isNetworkCallbackRegistered) return
    val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return
    val callback = object : ConnectivityManager.NetworkCallback() {
      override fun onAvailable(network: Network) {
        runOnUiThread {
          if (!isFinishing && !isDestroyed && isNetworkAvailable()) {
            handleConnectivityRestored(triggerReloadIfBundled = true)
          }
        }
      }

      override fun onCapabilitiesChanged(network: Network, capabilities: NetworkCapabilities) {
        val validated = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
          capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        if (validated) {
          runOnUiThread {
            if (!isFinishing && !isDestroyed) {
              handleConnectivityRestored(triggerReloadIfBundled = true)
            }
          }
        }
      }

      override fun onLost(network: Network) {
        runOnUiThread {
          if (!isFinishing && !isDestroyed && !isNetworkAvailable()) {
            webView.evaluateJavascript(
              "window.dispatchEvent(new Event('adoptame:network-lost'));",
              null
            )
          }
        }
      }
    }
    runCatching {
      cm.registerDefaultNetworkCallback(callback)
      networkCallback = callback
      isNetworkCallbackRegistered = true
    }
  }

  private fun unregisterNetworkObserver() {
    if (!isNetworkCallbackRegistered) return
    val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
    val callback = networkCallback
    if (cm != null && callback != null) {
      runCatching { cm.unregisterNetworkCallback(callback) }
    }
    networkCallback = null
    isNetworkCallbackRegistered = false
  }

  private fun handleConnectivityRestored(triggerReloadIfBundled: Boolean) {
    if (useBundledOfflineAssets && triggerReloadIfBundled) {
      useBundledOfflineAssets = false
      offlineFallbackUsedForCurrentLoad = false
      Toast.makeText(this, R.string.reconnected_syncing, Toast.LENGTH_SHORT).show()
      val targetUrl = webView.url?.takeIf { it.startsWith("https://") } ?: lastAttemptedUrl
      webView.loadUrl(targetUrl)
    } else {
      webView.evaluateJavascript(
        "window.dispatchEvent(new Event('adoptame:network-restored'));",
        null
      )
    }
    maybeCheckGithubApkUpdate()
  }

  private fun hasBundledIndex(): Boolean = assetStreamOrNull("$BUNDLED_ROOT/index.html")?.use { true } == true

  private fun assetStreamOrNull(assetPath: String): InputStream? =
    runCatching { assets.open(assetPath) }.getOrNull()

  private fun resolveBundledAssetResponse(uri: Uri): WebResourceResponse? {
    val rawPath = uri.path ?: return null
    val relative = when {
      rawPath == BASE_PATH || rawPath == "$BASE_PATH/" -> ""
      rawPath.startsWith("$BASE_PATH/") -> rawPath.removePrefix("$BASE_PATH/")
      else -> return null
    }
    if (relative.contains("..")) return null

    val clean = relative.trim('/')
    val assetPath = when {
      clean.isEmpty() -> "$BUNDLED_ROOT/index.html"
      assetStreamOrNull("$BUNDLED_ROOT/$clean")?.use { true } == true -> "$BUNDLED_ROOT/$clean"
      assetStreamOrNull("$BUNDLED_ROOT/$clean/index.html")?.use { true } == true -> "$BUNDLED_ROOT/$clean/index.html"
      !clean.substringAfterLast('/').contains('.') -> "$BUNDLED_ROOT/index.html"
      else -> return WebResourceResponse(
        "text/plain",
        "utf-8",
        404,
        "Not Found",
        emptyMap(),
        ByteArrayInputStream(ByteArray(0))
      )
    }

    val stream = assetStreamOrNull(assetPath) ?: return null
    val (mimeType, encoding) = mimeAndEncodingFor(assetPath)
    return WebResourceResponse(mimeType, encoding, stream)
  }

  private fun mimeAndEncodingFor(assetPath: String): Pair<String, String?> {
    val ext = assetPath.substringAfterLast('.', "").lowercase()
    return when (ext) {
      "html" -> "text/html" to "utf-8"
      "js", "mjs" -> "application/javascript" to "utf-8"
      "css" -> "text/css" to "utf-8"
      "json" -> "application/json" to "utf-8"
      "webmanifest" -> "application/manifest+json" to "utf-8"
      "svg" -> "image/svg+xml" to "utf-8"
      "png" -> "image/png" to null
      "webp" -> "image/webp" to null
      "jpg", "jpeg" -> "image/jpeg" to null
      "gif" -> "image/gif" to null
      "woff2" -> "font/woff2" to null
      "woff" -> "font/woff" to null
      "ico" -> "image/x-icon" to null
      else -> "application/octet-stream" to null
    }
  }

  private fun maybeCheckGithubApkUpdate() {
    if (hasCheckedApkUpdateThisSession || !isNetworkAvailable()) return
    hasCheckedApkUpdateThisSession = true

    backgroundExecutor.execute {
      runCatching {
        val conn = (URL(LATEST_RELEASE_API_URL).openConnection() as HttpURLConnection).apply {
          requestMethod = "GET"
          connectTimeout = 8000
          readTimeout = 8000
          setRequestProperty("Accept", "application/vnd.github+json")
          setRequestProperty("User-Agent", "AdoptaMEAndroid/${BuildConfig.VERSION_NAME}")
        }
        try {
          if (conn.responseCode !in 200..299) return@runCatching
          val body = conn.inputStream.bufferedReader().use { it.readText() }
          val json = JSONObject(body)
          val tagName = json.optString("tag_name").trim()
          val cleanRemoteVersion = tagName
            .removePrefix("android-v")
            .removePrefix("ANDROID-V")
            .removePrefix("v")
            .removePrefix("V")
          if (cleanRemoteVersion.isBlank() || compareSemver(cleanRemoteVersion, BuildConfig.VERSION_NAME) <= 0) {
            return@runCatching
          }

          val assets = json.optJSONArray("assets") ?: return@runCatching
          var fallbackApkUrl: String? = null
          var preferredApkUrl: String? = null
          for (i in 0 until assets.length()) {
            val asset = assets.optJSONObject(i) ?: continue
            val name = asset.optString("name")
            val downloadUrl = asset.optString("browser_download_url")
            if (!downloadUrl.startsWith(ALLOWED_RELEASE_PREFIX)) continue
            if (name == APK_FILENAME) {
              preferredApkUrl = downloadUrl
              break
            }
            if (name.endsWith(".apk", ignoreCase = true) && fallbackApkUrl == null) {
              fallbackApkUrl = downloadUrl
            }
          }
          val resolvedUrl = preferredApkUrl ?: fallbackApkUrl ?: return@runCatching

          runOnUiThread {
            if (!isFinishing && !isDestroyed) {
              showApkUpdateDialog(cleanRemoteVersion, resolvedUrl)
            }
          }
        } finally {
          conn.disconnect()
        }
      }
    }
  }

  private fun compareSemver(remote: String, current: String): Int {
    val rParts = remote.split("-")[0].split(".").map { it.toIntOrNull() ?: 0 }
    val cParts = current.split("-")[0].split(".").map { it.toIntOrNull() ?: 0 }
    for (i in 0..2) {
      val r = rParts.getOrElse(i) { 0 }
      val c = cParts.getOrElse(i) { 0 }
      if (r != c) return r.compareTo(c)
    }
    return 0
  }

  private fun showApkUpdateDialog(remoteVersion: String, downloadUrl: String) {
    AlertDialog.Builder(this)
      .setTitle(getString(R.string.apk_update_title, remoteVersion))
      .setMessage(R.string.apk_update_message)
      .setPositiveButton(R.string.apk_update_now) { _, _ ->
        downloadAndInstallApk(downloadUrl)
      }
      .setNegativeButton(R.string.apk_update_later, null)
      .show()
  }

  private fun canInstallUnknownApps(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.O || packageManager.canRequestPackageInstalls()

  private fun downloadAndInstallApk(downloadUrl: String) {
    if (!downloadUrl.startsWith(ALLOWED_RELEASE_PREFIX)) return

    if (!canInstallUnknownApps() && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      pendingApkDownloadUrl = downloadUrl
      Toast.makeText(this, R.string.apk_install_permission_hint, Toast.LENGTH_LONG).show()
      val settingsIntent = Intent(
        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
        Uri.parse("package:$packageName")
      )
      runCatching { installPermissionLauncher.launch(settingsIntent) }
      return
    }

    Toast.makeText(this, R.string.apk_downloading, Toast.LENGTH_SHORT).show()
    backgroundExecutor.execute {
      val downloadedFile = runCatching {
        val updatesDir = File(cacheDir, "updates").apply { mkdirs() }
        val targetFile = File(updatesDir, APK_FILENAME)
        openHttpsFollowingRedirects(downloadUrl).use { input ->
          FileOutputStream(targetFile).use { output ->
            input.copyTo(output)
          }
        }
        targetFile
      }.getOrNull()

      runOnUiThread {
        if (isFinishing || isDestroyed) return@runOnUiThread
        if (downloadedFile == null || !downloadedFile.exists()) {
          Toast.makeText(this, R.string.apk_download_error, Toast.LENGTH_LONG).show()
          return@runOnUiThread
        }
        val contentUri = FileProvider.getUriForFile(
          this,
          "${BuildConfig.APPLICATION_ID}.fileprovider",
          downloadedFile
        )
        val installIntent = Intent(Intent.ACTION_VIEW).apply {
          setDataAndType(contentUri, "application/vnd.android.package-archive")
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val started = runCatching { startActivity(installIntent) }.isSuccess
        if (!started) {
          Toast.makeText(this, R.string.apk_download_error, Toast.LENGTH_LONG).show()
        }
      }
    }
  }

  private fun openHttpsFollowingRedirects(initialUrl: String): InputStream {
    var currentUrl = initialUrl
    repeat(6) {
      if (!currentUrl.startsWith("https://")) {
        throw SecurityException("Blocked non-HTTPS redirect")
      }
      val conn = (URL(currentUrl).openConnection() as HttpURLConnection).apply {
        instanceFollowRedirects = false
        connectTimeout = 15000
        readTimeout = 30000
        setRequestProperty("User-Agent", "AdoptaMEAndroid/${BuildConfig.VERSION_NAME}")
      }
      val code = conn.responseCode
      if (code in setOf(301, 302, 303, 307, 308)) {
        val location = conn.getHeaderField("Location")
        conn.disconnect()
        if (location.isNullOrBlank()) throw IllegalStateException("Missing redirect location")
        currentUrl = URL(URL(currentUrl), location).toString()
      } else if (code in 200..299) {
        return conn.inputStream
      } else {
        conn.disconnect()
        throw IllegalStateException("HTTP $code downloading APK")
      }
    }
    throw IllegalStateException("Too many redirects downloading APK")
  }

  companion object {
    private const val ALLOWED_HOST = "naomyalvarado2026.github.io"
    private const val BASE_PATH = "/animalitos"
    private const val START_URL = "https://$ALLOWED_HOST$BASE_PATH/?app=1"
    private const val BUNDLED_ROOT = "www"
    private const val PREFS_NAME = "adoptame_app_prefs"
    private const val KEY_HAS_LOADED_LIVE = "has_loaded_live"
    private const val MAX_SPLASH_MS = 1800L
    private const val APK_FILENAME = "AdoptaME-android.apk"
    private const val ALLOWED_RELEASE_PREFIX = "https://github.com/naomyalvarado2026/animalitos/releases/"
    private const val LATEST_RELEASE_API_URL = "https://api.github.com/repos/naomyalvarado2026/animalitos/releases/latest"
    private val ALLOWED_EXTERNAL_SCHEMES = setOf("http", "https", "mailto", "tel", "sms", "geo", "whatsapp")
  }
}
