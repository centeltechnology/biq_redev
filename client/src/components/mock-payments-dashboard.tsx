import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, ArrowUpRight, Receipt, CheckCircle2, Globe } from "lucide-react";

const MOCK_PAYMENTS = [
  { id: "1", date: "Feb 18, 2026", title: "3-Tier Wedding Cake", number: "Q-1042", customer: "Sarah Mitchell", type: "Deposit", amount: 375, status: "succeeded" },
  { id: "2", date: "Feb 16, 2026", title: "Birthday Cupcakes (48ct)", number: "Q-1041", customer: "James Rivera", type: "Full Payment", amount: 192, status: "succeeded" },
  { id: "3", date: "Feb 14, 2026", title: "Valentine's Cake Pops", number: "Q-1040", customer: "Lauren Chen", type: "Full Payment", amount: 145, status: "succeeded" },
  { id: "4", date: "Feb 12, 2026", title: "Corporate Event Cake", number: "Q-1038", customer: "Apex Marketing", type: "Deposit", amount: 450, status: "succeeded" },
  { id: "5", date: "Feb 10, 2026", title: "Baby Shower Dessert Table", number: "Q-1037", customer: "Emily Torres", type: "Full Payment", amount: 520, status: "succeeded" },
  { id: "6", date: "Feb 8, 2026", title: "Custom Cookie Set (3dz)", number: "Q-1035", customer: "Maria Santos", type: "Full Payment", amount: 108, status: "succeeded" },
  { id: "7", date: "Feb 5, 2026", title: "Anniversary Cake", number: "Q-1034", customer: "David & Kim Lee", type: "Deposit", amount: 225, status: "succeeded" },
  { id: "8", date: "Feb 3, 2026", title: "Graduation Cupcakes (60ct)", number: "Q-1032", customer: "Tanya Brooks", type: "Full Payment", amount: 240, status: "succeeded" },
  { id: "9", date: "Feb 1, 2026", title: "Bridal Shower Macarons", number: "Q-1030", customer: "Rachel Kim", type: "Deposit", amount: 180, status: "succeeded" },
  { id: "10", date: "Jan 28, 2026", title: "Smash Cake + Cupcakes", number: "Q-1028", customer: "Priya Patel", type: "Full Payment", amount: 165, status: "succeeded" },
];

const MOCK_STATS = {
  totalReceived: 6420,
  netEarnings: 5974.60,
  monthlyReceived: 2600,
  totalTransactions: 10,
};

function fmt(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function MockPaymentsDashboard() {
  return (
    <div className="space-y-3 text-left" data-testid="mock-payments-dashboard">
      <div className="grid gap-2 grid-cols-3">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-1 pt-3 px-3">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <CardTitle className="text-[11px] font-medium">Online Payments</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0.5">
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
              Stripe Connected
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">Collecting deposits automatically.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-medium">Deposit Settings</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0.5">
            <p className="text-[10px] text-muted-foreground">Type: <span className="font-medium text-foreground">Percentage</span></p>
            <p className="text-[10px] text-muted-foreground">Amount: <span className="font-medium text-foreground">50%</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <div className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              <CardTitle className="text-[11px] font-medium">Currency</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0.5">
            <p className="text-sm font-medium">USD ($)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-2 grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium">Total Received</CardTitle>
            <DollarSign className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-base font-bold">{fmt(MOCK_STATS.totalReceived)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium">Net Earnings</CardTitle>
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-base font-bold text-green-600 dark:text-green-400">{fmt(MOCK_STATS.netEarnings)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium">This Month</CardTitle>
            <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-base font-bold">{fmt(MOCK_STATS.monthlyReceived)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-1 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium">Transactions</CardTitle>
            <Receipt className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 pb-2">
            <div className="text-base font-bold">{MOCK_STATS.totalTransactions}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-1 pt-2 px-3">
          <CardTitle className="text-xs">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] py-1.5 px-2">Date</TableHead>
                  <TableHead className="text-[10px] py-1.5 px-2">Quote</TableHead>
                  <TableHead className="text-[10px] py-1.5 px-2">Customer</TableHead>
                  <TableHead className="text-[10px] py-1.5 px-2">Type</TableHead>
                  <TableHead className="text-[10px] py-1.5 px-2 text-right">Amount</TableHead>
                  <TableHead className="text-[10px] py-1.5 px-2">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PAYMENTS.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-[10px] text-muted-foreground py-1.5 px-2">{p.date}</TableCell>
                    <TableCell className="py-1.5 px-2">
                      <p className="text-[10px] font-medium leading-tight">{p.title}</p>
                      <p className="text-[9px] text-muted-foreground">#{p.number}</p>
                    </TableCell>
                    <TableCell className="text-[10px] py-1.5 px-2">{p.customer}</TableCell>
                    <TableCell className="py-1.5 px-2">
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                        {p.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-right font-semibold py-1.5 px-2">{fmt(p.amount)}</TableCell>
                    <TableCell className="py-1.5 px-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[9px] px-1.5 py-0">
                        Paid
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
