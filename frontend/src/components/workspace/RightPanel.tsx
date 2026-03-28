import React from "react";

type RightPanelProps = {
    tabs: { key: string; label: string }[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    children: React.ReactNode;
};

export const RightPanel: React.FC<RightPanelProps> = ({ tabs, activeTab, onTabChange, children }) => {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            borderLeft: "1px solid #ddd",
            backgroundColor: "#fafafa",
        }}>
            <div style={{
                display: "flex",
                borderBottom: "1px solid #ddd",
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        style={{
                            flex: 1,
                            padding: "8px 12px",
                            border: "none",
                            borderBottom: activeTab === tab.key ? "2px solid #4a90d9" : "2px solid transparent",
                            backgroundColor: activeTab === tab.key ? "#fff" : "transparent",
                            fontWeight: activeTab === tab.key ? 600 : 400,
                            cursor: "pointer",
                            fontSize: "0.85rem",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div style={{ flex: 1, overflow: "auto" }}>
                {children}
            </div>
        </div>
    );
};
