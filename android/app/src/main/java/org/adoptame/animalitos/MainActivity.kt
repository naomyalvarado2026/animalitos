package org.adoptame.animalitos

import android.annotation.SuppressLint
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Message
import android.os.SystemClock
import android.view.View
import android.webkit.CookieManager
import android.webkit.JsResult
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
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
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

  private lateinit var rootContainer: FrameLayout
  private lateinit var swipeRefresh: SwipeRefreshLayout
  private lateinit var webView: WebView
  private lateinit var progressBar: ProgressBar
  private lateinit var offlineOverlay: LinearLayout
  private lateinit var retryButton: Button

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
      offlineOverlay.visibility = View.GONE
      webView.loadUrl(lastAttemptedUrl)
    }

    if (savedInstanceState != null) {
      webView.restoreState(savedInstanceState)
      initialLoadDone = true
    } else {
      val initialUrl = resolveStartUrl(intent)
      lastAttemptedUrl = initialUrl
      webView.loadUrl(initialUrl)
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    val deepLink = intent.data
    if (deepLink != null && isInternalAdoptameUrl(deepLink)) {
      val target = deepLink.toString()
      lastAttemptedUrl = target
      hasMainFrameError = false
      offlineOverlay.visibility = View.GONE
      webView.loadUrl(target)
    }
  }

  override fun onSaveInstanceState(outState: Bundle) {
    super.onSaveInstanceState(outState)
    webView.saveState(outState)
  }

  override fun onDestroy() {
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
        }
      }

      override fun onReceivedError(
        view: WebView?,
        request: WebResourceRequest?,
        error: WebResourceError?
      ) {
        super.onReceivedError(view, request, error)
        if (request?.isForMainFrame == true) {
          initialLoadDone = true
          hasMainFrameError = true
          swipeRefresh.isRefreshing = false
          progressBar.visibility = View.GONE
          lastAttemptedUrl = request.url?.toString() ?: lastAttemptedUrl
          offlineOverlay.visibility = View.VISIBLE
        }
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
    val data = intent?.data
    return if (data != null && isInternalAdoptameUrl(data)) data.toString() else START_URL
  }

  private fun isInternalAdoptameUrl(uri: Uri): Boolean {
    if (!uri.scheme.equals("https", ignoreCase = true)) return false
    if (!uri.host.equals(ALLOWED_HOST, ignoreCase = true)) return false
    val path = uri.path ?: return false
    return path == BASE_PATH || path.startsWith("$BASE_PATH/")
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

  companion object {
    private const val ALLOWED_HOST = "naomyalvarado2026.github.io"
    private const val BASE_PATH = "/animalitos"
    private const val START_URL = "https://$ALLOWED_HOST$BASE_PATH/?app=1"
    private const val MAX_SPLASH_MS = 1800L
    private val ALLOWED_EXTERNAL_SCHEMES = setOf("http", "https", "mailto", "tel", "sms", "geo", "whatsapp")
  }
}
