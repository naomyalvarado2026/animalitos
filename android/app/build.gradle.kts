import java.util.Properties

plugins {
  alias(libs.plugins.android.application)
}

val keystoreProps = Properties()
val keystorePropsFile = rootProject.file("keystore.properties")
if (keystorePropsFile.exists()) {
  keystorePropsFile.inputStream().use { keystoreProps.load(it) }
}

fun releaseSignValue(propKey: String, envKey: String): String? =
  keystoreProps.getProperty(propKey)?.takeIf { it.isNotBlank() }
    ?: System.getenv(envKey)?.takeIf { it.isNotBlank() }

val releaseStorePath = releaseSignValue("storeFile", "ANDROID_KEYSTORE_PATH")
val releaseStoreFile = releaseStorePath?.let { rootProject.file(it) }?.takeIf { it.exists() }
val releaseStorePassword = releaseSignValue("storePassword", "ANDROID_KEYSTORE_PASSWORD")
val releaseKeyAlias = releaseSignValue("keyAlias", "ANDROID_KEY_ALIAS")
val releaseKeyPassword = releaseSignValue("keyPassword", "ANDROID_KEY_PASSWORD")
val hasReleaseSigning = releaseStoreFile != null
  && releaseStorePassword != null
  && releaseKeyAlias != null
  && releaseKeyPassword != null

android {
  namespace = "org.adoptame.animalitos"
  compileSdk = 35

  defaultConfig {
    applicationId = "org.adoptame.animalitos"
    minSdk = 24
    targetSdk = 35
    versionCode = (project.findProperty("appVersionCode") as String?)?.toIntOrNull() ?: 1
    versionName = (project.findProperty("appVersionName") as String?)?.ifBlank { null } ?: "1.0.0"
  }

  signingConfigs {
    create("release") {
      if (hasReleaseSigning) {
        storeFile = releaseStoreFile
        storePassword = releaseStorePassword
        keyAlias = releaseKeyAlias
        keyPassword = releaseKeyPassword
        enableV1Signing = true
        enableV2Signing = true
        enableV3Signing = true
      }
    }
  }

  buildTypes {
    release {
      isMinifyEnabled = false
      isDebuggable = false
      if (hasReleaseSigning) {
        signingConfig = signingConfigs.getByName("release")
      }
      proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
    }
  }

  compileOptions {
    sourceCompatibility = JavaVersion.VERSION_21
    targetCompatibility = JavaVersion.VERSION_21
  }

  buildFeatures {
    buildConfig = true
    aidl = false
    shaders = false
  }

  packaging {
    resources {
      excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
  }
}

kotlin {
  jvmToolchain(21)
}

dependencies {
  implementation(libs.androidx.core.ktx)
  implementation(libs.androidx.appcompat)
  implementation(libs.androidx.activity.ktx)
  implementation(libs.androidx.swiperefreshlayout)
  implementation(libs.androidx.core.splashscreen)
  implementation(libs.androidx.webkit)
}
