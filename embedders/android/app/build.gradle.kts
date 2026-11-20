plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Test-only init-failure injection: `-Ptenun.testInjection=true` compiles
// the native hook (CMake TENUN_ENABLE_TEST_INJECTION). Used exclusively by
// the device-acceptance fail-visible stage; production and standard debug
// builds never define it.
val tenunTestInjection = providers.gradleProperty("tenun.testInjection").map { it == "true" }.getOrElse(false)

android {
    namespace = "id.my.tenun.embedder"
    compileSdk = 36
    ndkVersion = "28.2.13676358"

    defaultConfig {
        applicationId = "id.my.tenun.embedder"
        minSdk = 26
        targetSdk = 36
        versionCode = 12
        versionName = "0.2.1"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        externalNativeBuild {
            cmake {
                cFlags("-std=c11 -Wall -Wextra -Werror")
                if (tenunTestInjection) {
                    arguments("-DTENUN_ENABLE_TEST_INJECTION=ON")
                }
            }
        }

        ndk {
            abiFilters.addAll(listOf("arm64-v8a", "x86_64"))
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    // Keep the touch reference app separate from NusaTV's phone and TV
    // source sets. TV adds a leanback entry point and armeabi-v7a (TN-195).
    flavorDimensions += "app"
    productFlavors {
        create("touch") {
            dimension = "app"
        }
        create("phone") {
            dimension = "app"
            // Retain the application ID of the first NusaTV phone release.
            applicationId = "id.my.tenun.embedder"
        }
        create("tv") {
            dimension = "app"
            applicationId = "id.my.tenun.tvplayer"
            ndk {
                // Declared as the full set so the variant does not depend
                // on flavor/defaultConfig collection-merge semantics; this
                // is defaultConfig's arm64-v8a + x86_64 PLUS the TV's
                // armeabi-v7a (TN-195).
                abiFilters.addAll(listOf("arm64-v8a", "x86_64", "armeabi-v7a"))
            }
        }
    }

    // Older NusaTV builds generated a phone asset in the touch source set.
    // The reference flavor must use only the shared assets, even locally.
    sourceSets.getByName("touch").assets.setSrcDirs(emptyList<String>())

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // TN-193 media host service: ExoPlayer core + HLS playback
    // (04-api/media.md; the TextureView overlay needs no media3-ui).
    implementation("androidx.media3:media3-exoplayer:1.5.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.5.1")

    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")

    // TN-132 installed-device acceptance (androidTest): exercised only by
    // connectedTouchDebugAndroidTest / am instrument against a booted emulator.
    androidTestImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test:core:1.6.1")
    androidTestImplementation("androidx.test:runner:1.6.2")
    androidTestImplementation("androidx.test.uiautomator:uiautomator:2.3.0")
}
