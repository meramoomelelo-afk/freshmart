import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { Home } from "@/pages/home";
import { Products } from "@/pages/products";
import { Category } from "@/pages/category";
import { Cart } from "@/pages/cart";
import { CheckoutAddress } from "@/pages/checkout-address";
import { CheckoutSlot } from "@/pages/checkout-slot";
import { CheckoutPayment } from "@/pages/checkout-payment";
import { ProductDetail } from "@/pages/product-detail";
import { Categories } from "@/pages/categories";
import { Account } from "@/pages/account";
import { Login } from "@/pages/login";
import { OrderTracking } from "@/pages/order-tracking";
import { AdminLogin } from "@/pages/admin/login";
import { AdminDashboard } from "@/pages/admin/dashboard";
import { AdminProducts } from "@/pages/admin/products";
import { AdminCategories } from "@/pages/admin/categories";
import { AdminOrders } from "@/pages/admin/orders";
import { AdminSettings } from "@/pages/admin/settings";
import { AdminCoupons } from "@/pages/admin/coupons";
import { AuthProvider } from "@/lib/auth";
import { WishlistProvider } from "@/lib/wishlist";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location]);
  return null;
}

function PageTransition({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin/categories" component={AdminCategories} />
        <Route path="/admin/orders" component={AdminOrders} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/coupons" component={AdminCoupons} />
        <Route path="/login">
          {() => <Layout><PageTransition><Login /></PageTransition></Layout>}
        </Route>
        <Route path="/">
          {() => <Layout><PageTransition><Home /></PageTransition></Layout>}
        </Route>
        <Route path="/categories">
          {() => <Layout><PageTransition><Categories /></PageTransition></Layout>}
        </Route>
        <Route path="/products">
          {() => <Layout><PageTransition><Products /></PageTransition></Layout>}
        </Route>
        <Route path="/category/:slug">
          {() => <Layout><PageTransition><Category /></PageTransition></Layout>}
        </Route>
        <Route path="/product/:id">
          {() => <Layout><PageTransition><ProductDetail /></PageTransition></Layout>}
        </Route>
        <Route path="/cart">
          {() => <Layout><PageTransition><Cart /></PageTransition></Layout>}
        </Route>
        <Route path="/checkout/address">
          {() => <Layout><PageTransition><CheckoutAddress /></PageTransition></Layout>}
        </Route>
        <Route path="/checkout/slot">
          {() => <Layout><PageTransition><CheckoutSlot /></PageTransition></Layout>}
        </Route>
        <Route path="/checkout/payment">
          {() => <Layout><PageTransition><CheckoutPayment /></PageTransition></Layout>}
        </Route>
        <Route path="/account">
          {() => <Layout><PageTransition><Account /></PageTransition></Layout>}
        </Route>
        <Route path="/order/:id">
          {() => <Layout><PageTransition><OrderTracking /></PageTransition></Layout>}
        </Route>
        <Route>
          {() => <Layout><PageTransition><NotFound /></PageTransition></Layout>}
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WishlistProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </WishlistProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
