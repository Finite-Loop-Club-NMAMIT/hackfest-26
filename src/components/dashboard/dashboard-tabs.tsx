"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

type TabConfig = {
  id: string;
  label: React.ReactNode;
  hasAccess: boolean;
  content: React.ReactNode;
};

type DashboardTabsProps = {
  tabs: TabConfig[];
  defaultTab?: string;
  storageKey?: string;
  searchParamKey?: string;
};

export function DashboardTabs({
  tabs,
  defaultTab,
  storageKey = "dashboardActiveTab",
  searchParamKey = "tab",
}: DashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const hasInitialized = useRef(false);

  const accessibleTabs = useMemo(
    () => tabs.filter((tab) => tab.hasAccess),
    [tabs],
  );

  const initialTab = useMemo(() => {
    const urlTab = searchParams.get(searchParamKey);
    if (urlTab && accessibleTabs.some((tab) => tab.id === urlTab)) {
      return urlTab;
    }

    if (typeof window !== "undefined") {
      const storedTab = localStorage.getItem(storageKey);
      if (storedTab && accessibleTabs.some((tab) => tab.id === storedTab)) {
        return storedTab;
      }
    }

    return defaultTab ?? accessibleTabs[0]?.id ?? "";
  }, [accessibleTabs, defaultTab, searchParamKey, searchParams, storageKey]);

  useEffect(() => {
    if (hasInitialized.current) return;

    setIsClient(true);
    setActiveTab(initialTab);
    hasInitialized.current = true;
  }, [initialTab]);

  useEffect(() => {
    if (!activeTab) return;
    if (accessibleTabs.some((tab) => tab.id === activeTab)) return;

    setActiveTab(accessibleTabs[0]?.id ?? "");
  }, [accessibleTabs, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, value);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(searchParamKey, value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  if (!isClient || accessibleTabs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-center mb-6 h-auto flex-wrap gap-1 bg-muted/50 p-1">
        {accessibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {accessibleTabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
