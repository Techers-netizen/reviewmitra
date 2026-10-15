package com.opensoz.reviewmitra

import android.content.Context
import android.os.Vibrator
import android.webkit.JavascriptInterface
import android.widget.Toast

class WebAppInterface(private val context: Context) {

    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    @JavascriptInterface
    fun vibrate(milliseconds: Long) {
        val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        vibrator?.vibrate(milliseconds)
    }

    @JavascriptInterface
    fun getAppVersion(): String {
        return "1.0.0"
    }
}
