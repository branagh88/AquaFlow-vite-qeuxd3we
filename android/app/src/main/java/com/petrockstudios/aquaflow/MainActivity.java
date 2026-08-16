package com.petrockstudios.aquaflow;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.petrockstudios.aquaflow.plugins.AquaFlowGenAIPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AquaFlowGenAIPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
