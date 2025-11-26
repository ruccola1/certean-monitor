import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Retailers() {
  return (
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl space-y-8">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Retailers</h1>
          <p className="text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">
            Manage your retail partners and distribution channels
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Total Retailers
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Active retailers in your network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">0</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Pending Agreements
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Retailers with pending contracts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">0</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Active Partners
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Retailers with active agreements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">0</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-0">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
              Retailer List
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              View and manage all your retail partners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p className="text-sm">No retailers added yet. Add your first retailer to get started.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

