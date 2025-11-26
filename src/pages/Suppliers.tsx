import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Suppliers() {
  return (
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl space-y-8">
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Suppliers</h1>
          <p className="text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">
            Manage your supplier network and compliance documentation
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Total Suppliers
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Active suppliers in your network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">0</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Pending Verification
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Suppliers awaiting compliance review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">0</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Compliant Suppliers
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Fully verified and compliant
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
              Supplier List
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              View and manage all your suppliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12 text-gray-500">
              <p className="text-sm">No suppliers added yet. Add your first supplier to get started.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


