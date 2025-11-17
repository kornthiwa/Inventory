"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyIcon from "@mui/icons-material/AttachMoneyOutlined";
import { productService, categoryService } from "./lib/services";

export default function Dashboard() {
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", "dashboard"],
    queryFn: () => productService.getAll({ limit: 1000 }),
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", "dashboard"],
    queryFn: () => categoryService.getAll({ limit: 1000 }),
  });

  const loading = productsLoading || categoriesLoading;

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];

  const totalValue = products.reduce(
    (sum: number, p: { price?: number; quantity?: number }) =>
      sum + (p.price || 0) * (p.quantity || 0),
    0
  );

  const lowStockProducts = products.filter(
    (p: { quantity?: number }) => (p.quantity || 0) < 10
  ).length;

  const stats = {
    totalProducts: products.length,
    totalCategories: categories.length,
    totalValue,
    lowStockProducts,
  };

  const statCards = [
    {
      title: "สินค้าทั้งหมด",
      value: stats.totalProducts,
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      color: "#1976d2",
    },
    {
      title: "หมวดหมู่",
      value: stats.totalCategories,
      icon: <CategoryIcon sx={{ fontSize: 40 }} />,
      color: "#2e7d32",
    },
    {
      title: "มูลค่ารวม",
      value: new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(stats.totalValue),
      icon: <AttachMoneyIcon sx={{ fontSize: 40 }} />,
      color: "#ed6c02",
    },
    {
      title: "สินค้าคงคลังต่ำ",
      value: stats.lowStockProducts,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: "#d32f2f",
    },
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card
              sx={{
                height: "100%",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" component="div" fontWeight="bold">
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
