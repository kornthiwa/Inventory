"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import * as Yup from "yup";
import {
  productService,
  categoryService,
  type Product,
  type Category,
} from "../lib/services";
import { Formik, Form, Field } from "formik";

const productSchema = Yup.object().shape({
  name: Yup.string().required("กรุณากรอกชื่อสินค้า"),
  code: Yup.string(),
  price: Yup.number()
    .min(0, "ราคาต้องมากกว่าหรือเท่ากับ 0")
    .required("กรุณากรอกราคา"),
  quantity: Yup.number()
    .min(0, "จำนวนต้องมากกว่าหรือเท่ากับ 0")
    .required("กรุณากรอกจำนวน"),
  category: Yup.string().required("กรุณาเลือกหมวดหมู่"),
});

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ["products", page, limit],
    queryFn: () => productService.getAll({ page, limit }),
  });

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll({ limit: 1000 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      code?: string;
      description?: string;
      price: number;
      quantity: number;
      sku?: string;
      category: string;
      active?: boolean;
    }) => {
      // ไม่ส่ง code ตอนสร้าง เพราะ backend จะสร้างให้อัตโนมัติ
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { code, ...dataWithoutCode } = data;
      return productService.create(dataWithoutCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "dashboard"] });
      handleClose();
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการสร้างสินค้า";
      setErrorMessage(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        code?: string;
        description?: string;
        price?: number;
        quantity?: number;
        sku?: string;
        category?: string;
        active?: boolean;
      };
    }) => productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "dashboard"] });
      handleClose();
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการแก้ไขสินค้า";
      setErrorMessage(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "dashboard"] });
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการลบสินค้า";
      setErrorMessage(message);
    },
  });

  const products = productsResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const pagination = productsResponse?.pagination;
  const loading = productsLoading || categoriesLoading;

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const handleLimitChange = (event: { target: { value: unknown } }) => {
    setLimit(Number(event.target.value));
    setPage(1); // Reset to first page when changing limit
  };

  const handleOpen = (product?: Product) => {
    setEditingProduct(product || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (values: {
    name: string;
    code?: string;
    description?: string;
    price: number;
    quantity: number;
    sku?: string;
    category: string;
    active?: boolean;
  }) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบสินค้านี้หรือไม่?")) return;
    deleteMutation.mutate(id);
  };

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          จัดการสินค้า
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          เพิ่มสินค้า
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>รหัส</TableCell>
              <TableCell>ชื่อสินค้า</TableCell>
              <TableCell>หมวดหมู่</TableCell>
              <TableCell align="right">ราคา</TableCell>
              <TableCell align="right">จำนวน</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 3 }}
                  >
                    ไม่พบข้อมูลสินค้า
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.code}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    {typeof product.category === "object"
                      ? product.category.name
                      : "N/A"}
                  </TableCell>
                  <TableCell align="right">
                    {new Intl.NumberFormat("th-TH", {
                      style: "currency",
                      currency: "THB",
                    }).format(product.price)}
                  </TableCell>
                  <TableCell align="right">{product.quantity}</TableCell>
                  <TableCell>
                    <Chip
                      label={product.active ? "ใช้งาน" : "ไม่ใช้งาน"}
                      color={product.active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(product)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(product._id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              แสดง{" "}
              {pagination.page === 1
                ? 1
                : (pagination.page - 1) * pagination.limit + 1}{" "}
              - {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              จาก {pagination.total} รายการ
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>แสดงต่อหน้า</InputLabel>
              <Select
                value={limit}
                label="แสดงต่อหน้า"
                onChange={handleLimitChange}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <Formik
          initialValues={{
            name: editingProduct?.name || "",
            code: editingProduct?.code || "",
            description: editingProduct?.description || "",
            price: editingProduct?.price || 0,
            quantity: editingProduct?.quantity || 0,
            sku: editingProduct?.sku || "",
            category:
              typeof editingProduct?.category === "object"
                ? editingProduct.category._id
                : editingProduct?.category || "",
            active: editingProduct?.active ?? true,
          }}
          validationSchema={productSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form>
              <DialogTitle>
                {editingProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}
              </DialogTitle>
              <DialogContent>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mt: 1,
                  }}
                >
                  <Field
                    as={TextField}
                    name="name"
                    label="ชื่อสินค้า"
                    fullWidth
                    error={touched.name && !!errors.name}
                    helperText={touched.name && errors.name}
                  />
                  {editingProduct && (
                    <Field
                      as={TextField}
                      name="code"
                      label="รหัสสินค้า"
                      fullWidth
                      disabled
                      helperText="รหัสสินค้าถูกสร้างอัตโนมัติและไม่สามารถแก้ไขได้"
                    />
                  )}
                  <Field
                    as={TextField}
                    name="description"
                    label="คำอธิบาย"
                    fullWidth
                    multiline
                    rows={3}
                  />
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Field
                      as={TextField}
                      name="price"
                      label="ราคา"
                      type="number"
                      fullWidth
                      error={touched.price && !!errors.price}
                      helperText={touched.price && errors.price}
                    />
                    <Field
                      as={TextField}
                      name="quantity"
                      label="จำนวน"
                      type="number"
                      fullWidth
                      error={touched.quantity && !!errors.quantity}
                      helperText={touched.quantity && errors.quantity}
                    />
                  </Box>
                  <Field as={TextField} name="sku" label="SKU" fullWidth />
                  <Field
                    as={TextField}
                    name="category"
                    label="หมวดหมู่"
                    select
                    SelectProps={{ native: true }}
                    fullWidth
                    error={touched.category && !!errors.category}
                    helperText={touched.category && errors.category}
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map((cat: Category) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </Field>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>ยกเลิก</Button>
                <Button type="submit" variant="contained">
                  บันทึก
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
