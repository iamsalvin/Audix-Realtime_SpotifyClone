import { usePremiumStore } from "@/stores/usePremiumStore";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Calendar, Crown, Search, Settings } from "lucide-react";
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
import { UserDetails } from "@/stores/usePremiumStore";

const UsersTabContent = () => {
  const { premiumUsers, fetchPremiumUsers } = usePremiumStore();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchPremiumUsers();
      setLoading(false);
    };

    loadData();
  }, [fetchPremiumUsers]);

  // Filter users based on search term
  const filteredUsers = searchTerm
    ? premiumUsers.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.premiumTier.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : premiumUsers;

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Premium Users</CardTitle>
            <CardDescription>
              Manage user subscriptions and premium status
            </CardDescription>
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
                  <TableHead className="text-zinc-400">Tier</TableHead>
                  <TableHead className="text-zinc-400">Start Date</TableHead>
                  <TableHead className="text-zinc-400">Expiry Date</TableHead>
                  <TableHead className="text-zinc-400">
                    Plan Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-zinc-500"
                    >
                      {searchTerm
                        ? "No users matching your search"
                        : "No premium users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
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
                              {user.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Crown
                            className={`h-4 w-4 ${getTierColor(
                              user.premiumTier
                            )}`}
                          />
                          <span className="capitalize">{user.premiumTier}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-zinc-500" />
                          {user.premiumSince
                            ? formatDate(new Date(user.premiumSince))
                            : "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.premiumExpiresAt
                          ? formatDate(new Date(user.premiumExpiresAt))
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${getTierColor(user.premiumTier)}`}>
                            {getPlanAmount(user.premiumTier)}
                          </span>
                          <button
                            className="p-1 hover:bg-zinc-700 rounded-md"
                            title="Manage subscription"
                          >
                            <Settings className="h-4 w-4 text-zinc-400" />
                          </button>
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

export default UsersTabContent;
