import { usePremiumStore } from "@/stores/usePremiumStore";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Check,
  Clock,
  Crown,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface UserDetails {
  _id: string;
  clerkId: string;
  fullName: string;
  imageUrl: string;
  email: string;
  isPremium: boolean;
  premiumTier: string;
  premiumSince: string;
  premiumExpiresAt: string;
  subscriptionId: string;
  createdAt: string;
}

const AllUsersTabContent = () => {
  const { allUsers, fetchAllUsers } = usePremiumStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "premium" | "free">(
    "all"
  );

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchAllUsers();
      setLoading(false);
    };

    loadData();
  }, [fetchAllUsers]);

  // Filter users based on search term and status filter
  const filteredUsers = allUsers.filter((user: UserDetails) => {
    // First apply the status filter
    if (statusFilter === "premium" && !user.isPremium) return false;
    if (statusFilter === "free" && user.isPremium) return false;

    // Then apply the search filter if there's a search term
    if (!searchTerm) return true;

    return (
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.premiumTier &&
        user.premiumTier.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "premium":
        return "text-amber-500";
      case "standard":
        return "text-emerald-500";
      case "basic":
        return "text-blue-500";
      default:
        return "text-zinc-400";
    }
  };

  // Helper function to get the price amount based on tier
  const getPlanAmount = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "premium":
        return "₹199";
      case "standard":
        return "₹149";
      case "basic":
        return "₹99";
      default:
        return "N/A";
    }
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">All Users</CardTitle>
            <CardDescription>
              View and manage all users and their subscription status
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                className={
                  statusFilter === "all" ? "bg-zinc-700 hover:bg-zinc-600" : ""
                }
                onClick={() => setStatusFilter("all")}
              >
                <User className="h-3 w-3 mr-1" />
                All
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "premium" ? "default" : "outline"}
                className={
                  statusFilter === "premium"
                    ? "bg-amber-700 hover:bg-amber-600"
                    : ""
                }
                onClick={() => setStatusFilter("premium")}
              >
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "free" ? "default" : "outline"}
                className={
                  statusFilter === "free" ? "bg-blue-700 hover:bg-blue-600" : ""
                }
                onClick={() => setStatusFilter("free")}
              >
                <X className="h-3 w-3 mr-1" />
                Free
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-[250px] bg-zinc-800 border-zinc-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-emerald-500 rounded-full border-t-transparent" />
          </div>
        ) : (
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader className="bg-zinc-800/50">
                <TableRow className="hover:bg-zinc-800/80">
                  <TableHead className="text-zinc-400">User</TableHead>
                  <TableHead className="text-zinc-400">Email</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Tier</TableHead>
                  <TableHead className="text-zinc-400">Plan Amount</TableHead>
                  <TableHead className="text-zinc-400">Start Date</TableHead>
                  <TableHead className="text-zinc-400">Expiry Date</TableHead>
                  <TableHead className="text-zinc-400">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-zinc-500"
                    >
                      {searchTerm
                        ? "No users matching your search"
                        : "No users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user: UserDetails) => (
                    <TableRow
                      key={user.clerkId}
                      className="hover:bg-zinc-800/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.imageUrl}
                              alt={user.fullName}
                            />
                            <AvatarFallback>
                              {user.fullName?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.isPremium ? (
                          <div className="flex items-center gap-1 text-emerald-500">
                            <Check className="h-4 w-4" />
                            <span>Premium</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-zinc-400">
                            <X className="h-4 w-4" />
                            <span>Free</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isPremium ? (
                          <div className="flex items-center gap-1">
                            <Crown
                              className={`h-4 w-4 ${getTierColor(
                                user.premiumTier
                              )}`}
                            />
                            <span className="capitalize">
                              {user.premiumTier}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isPremium ? (
                          <span className={`font-medium ${getTierColor(user.premiumTier)}`}>
                            {getPlanAmount(user.premiumTier)}
                          </span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isPremium && user.premiumSince ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-zinc-500" />
                            {formatDate(new Date(user.premiumSince))}
                          </div>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isPremium && user.premiumExpiresAt ? (
                          formatDate(new Date(user.premiumExpiresAt))
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-zinc-500" />
                          {user.createdAt
                            ? formatDate(new Date(user.createdAt))
                            : "N/A"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AllUsersTabContent;
