import { useMusicStore } from "@/stores/useMusicStore";
import { Crown, Library, ListMusic, Users2 } from "lucide-react";
import StatsCard from "./StatsCard";
import { useEffect, useState, useRef } from "react";
import { axiosInstance } from "@/lib/axios";

const DashboardStats = () => {
  const { stats } = useMusicStore();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastFetchTimeRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  // Function to directly fetch stats from the server without notifications
  const fetchStatsDirectly = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) return false;

    // Rate limit to at most once every 3 seconds
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 3000) return false;

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      // Make direct API request - try all possible endpoints
      const possibleEndpoints = ["/api/stats", "/stats", "/analytics/stats"];

      for (const endpoint of possibleEndpoints) {
        try {
          const response = await axiosInstance.get(endpoint);
          if (response.status === 200 && response.data) {
            const data = response.data;

            // Manually update the store with fresh data
            useMusicStore.setState({
              stats: {
                totalSongs: data.totalSongs || 0,
                totalAlbums: data.totalAlbums || 0,
                totalUsers: data.totalUsers || 0,
                totalArtists: data.totalArtists || 0,
                premiumUsers: data.premiumUsers || 0,
                premiumPercentage: data.premiumPercentage || 0,
              },
            });

            console.log(`Stats updated silently from ${endpoint}`);
            isFetchingRef.current = false;
            return true;
          }
        } catch (err) {
          // Silent failure, just log to console
          console.log(`Failed endpoint ${endpoint}:`, err.message);
        }
      }

      isFetchingRef.current = false;
      return false;
    } catch (error) {
      console.error("Error fetching stats:", error);
      isFetchingRef.current = false;
      return false;
    }
  };

  // Initial fetch and set up polling
  useEffect(() => {
    // Immediately fetch on mount
    fetchStatsDirectly().then(() => {
      setIsInitialLoad(false);
    });

    // Set up polling every 10 seconds
    const pollingInterval = setInterval(() => {
      fetchStatsDirectly();
    }, 10000);

    // Clean up
    return () => clearInterval(pollingInterval);
  }, []);

  // Additional fetch when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStatsDirectly();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Safely get number values with fallbacks
  const safeNumber = (value: any) => {
    return typeof value === "number" ? value : 0;
  };

  // Format numbers safely
  const formatNumber = (num: any) => {
    return safeNumber(num).toLocaleString();
  };

  // Get percentage safely
  const getPremiumPercentage = () => {
    const premiumUsers = safeNumber(stats?.premiumUsers);
    const totalUsers = safeNumber(stats?.totalUsers);

    if (totalUsers === 0) return 0;
    return Math.round((premiumUsers / totalUsers) * 100);
  };

  const statsData = [
    {
      icon: ListMusic,
      label: "Total Songs",
      value: formatNumber(stats?.totalSongs),
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
    },
    {
      icon: Library,
      label: "Total Albums",
      value: formatNumber(stats?.totalAlbums),
      bgColor: "bg-violet-500/10",
      iconColor: "text-violet-500",
    },
    {
      icon: Users2,
      label: "Total Artists",
      value: formatNumber(stats?.totalArtists),
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    {
      icon: Users2,
      label: "Total Users",
      value: formatNumber(stats?.totalUsers),
      bgColor: "bg-sky-500/10",
      iconColor: "text-sky-500",
    },
    {
      icon: Crown,
      label: "Premium Users",
      value:
        stats?.premiumUsers !== undefined
          ? `${formatNumber(stats.premiumUsers)} (${getPremiumPercentage()}%)`
          : "0 (0%)",
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-500",
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Dashboard Overview</h2>
        {isInitialLoad && (
          <div className="text-sm text-zinc-400">Loading stats...</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statsData.map((stat) => (
          <StatsCard
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            bgColor={stat.bgColor}
            iconColor={stat.iconColor}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
