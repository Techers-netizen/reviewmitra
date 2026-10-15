package com.opensoz.reviewmitra

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.*
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.opensoz.reviewmitra.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val baseUrl = "https://reviewmitra.opensoz.com"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWebView()
        setupBottomNavigation()
        setupSwipeRefresh()
        setupBackNavigation()

        loadUrl(baseUrl)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webSettings = binding.mainWebView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        webSettings.cacheMode = WebSettings.LOAD_DEFAULT
        webSettings.userAgentString = "${webSettings.userAgentString} ReviewMitraAndroid/1.0"
        webSettings.useWideViewPort = true
        webSettings.loadWithOverviewMode = true

        binding.mainWebView.addJavascriptInterface(WebAppInterface(this), "AndroidBridge")

        binding.mainWebView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false

                // Open external links (Google Maps, Facebook, WhatsApp, etc.) in native external apps
                if (!url.contains("reviewmitra") && !url.contains("opensoz")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
                return false
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                binding.swipeRefresh.isRefreshing = true
                binding.offlineLayout.visibility = View.GONE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                binding.swipeRefresh.isRefreshing = false
                updateToolbarTitle(url)
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame == true && !isNetworkAvailable()) {
                    binding.offlineLayout.visibility = View.VISIBLE
                    binding.swipeRefresh.isRefreshing = false
                }
            }
        }

        binding.btnRetry.setOnClickListener {
            if (isNetworkAvailable()) {
                binding.offlineLayout.visibility = View.GONE
                binding.mainWebView.reload()
            }
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_overview -> {
                    loadUrl("$baseUrl/dashboard")
                    true
                }
                R.id.nav_reviews -> {
                    loadUrl("$baseUrl/dashboard/reviews")
                    true
                }
                R.id.nav_qr -> {
                    loadUrl("$baseUrl/dashboard/qr-booster")
                    true
                }
                R.id.nav_autoreply -> {
                    loadUrl("$baseUrl/dashboard/auto-reply")
                    true
                }
                R.id.nav_settings -> {
                    loadUrl("$baseUrl/dashboard/settings")
                    true
                }
                else -> false
            }
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setColorSchemeResources(R.color.emerald_600)
        binding.swipeRefresh.setOnRefreshListener {
            binding.mainWebView.reload()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.mainWebView.canGoBack()) {
                    binding.mainWebView.goBack()
                } else {
                    finish()
                }
            }
        })
    }

    private fun loadUrl(url: String) {
        if (isNetworkAvailable()) {
            binding.mainWebView.loadUrl(url)
        } else {
            binding.offlineLayout.visibility = View.VISIBLE
        }
    }

    private fun updateToolbarTitle(url: String?) {
        when {
            url?.contains("/reviews") == true -> binding.topToolbar.title = "Unified Review Inbox"
            url?.contains("/qr-booster") == true -> binding.topToolbar.title = "Smart QR Standee"
            url?.contains("/auto-reply") == true -> binding.topToolbar.title = "AI Auto-Reply Engine"
            url?.contains("/connect") == true -> binding.topToolbar.title = "Platform Connections"
            url?.contains("/guide") == true -> binding.topToolbar.title = "Help & Setup Guide"
            url?.contains("/billing") == true -> binding.topToolbar.title = "Plans & Billing"
            url?.contains("/settings") == true -> binding.topToolbar.title = "Settings"
            else -> binding.topToolbar.title = "ReviewMitra"
        }
    }

    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getSystemService(CONNECTIVITY_SERVICE) as ConnectivityManager
        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}
