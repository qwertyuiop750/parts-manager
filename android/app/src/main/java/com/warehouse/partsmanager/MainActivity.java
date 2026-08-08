package com.warehouse.partsmanager;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 确保系统栏（状态栏/导航栏）不会覆盖 WebView 内容
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
