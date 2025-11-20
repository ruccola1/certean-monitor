import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Certean Monitor</h1>
          <p className="text-muted-foreground mt-2">
            Compliance monitoring platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Total products monitored</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <Badge variant="secondary" className="mt-2">Free Tier</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Elements</CardTitle>
              <CardDescription>Tracked regulations & standards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <Badge variant="secondary" className="mt-2">0 / 5 used</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Pending compliance updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">0</div>
              <Badge variant="secondary" className="mt-2">All caught up</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Add your first product to begin compliance monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Welcome to Certean Monitor! Start by adding a product to automatically analyze compliance requirements,
              identify regulations and standards, and receive real-time updates.
            </p>
            <Button>
              Add Your First Product
            </Button>
          </CardContent>
        </Card>

        <Card className="border-brand-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              System Status
              <Badge variant="success">Connected</Badge>
            </CardTitle>
            <CardDescription>Backend API connection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">API Endpoint:</span>
                <span className="font-mono">{import.meta.env.VITE_API_BASE_URL || 'https://q57c4vz2em.eu-west-1.awsapprunner.com'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frontend Version:</span>
                <span>1.0.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

