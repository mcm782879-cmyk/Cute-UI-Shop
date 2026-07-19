import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/hooks/use-auth';
import Layout from '@/components/layout';

import Home from '@/pages/home';
import ServiceDetail from '@/pages/service-detail';
import OrderPage from '@/pages/order';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import MyOrdersPage from '@/pages/my-orders';
import AdminDashboard from '@/pages/admin/dashboard';
import AdminOrders from '@/pages/admin/orders';
import AdminServices from '@/pages/admin/services';
import AdminPackages from '@/pages/admin/packages';
import AdminPayments from '@/pages/admin/payments';
import AdminGallery from '@/pages/admin/gallery';
import AdminSettings from '@/pages/admin/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/services/:id" component={ServiceDetail} />
        <Route path="/order/:packageId" component={OrderPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/my-orders" component={MyOrdersPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/services" component={AdminServices} />
        <Route path="/admin/packages/:serviceId" component={AdminPackages} />
        <Route path="/admin/payments" component={AdminPayments} />
        <Route path="/admin/gallery" component={AdminGallery} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
          <SonnerToaster position="top-center" />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
