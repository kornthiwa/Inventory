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
  CircularProgress,
  Chip,
  TextField,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import * as Yup from "yup";
import { categoryService } from "../lib/services";
import { Formik, Form, Field } from "formik";

interface Category {
  _id: string;
  name: string;
  code: string;
  description?: string;
  active: boolean;
}

const categorySchema = Yup.object().shape({
  name: Yup.string().required("กรุณากรอกชื่อหมวดหมู่"),
  description: Yup.string(),
});

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", page, limit],
    queryFn: () => categoryService.getAll({ page, limit }),
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      active?: boolean;
    }) => categoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "dashboard"] });
      handleClose();
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
        description?: string;
        active?: boolean;
      };
    }) => categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "dashboard"] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "dashboard"] });
    },
  });

  const categories = categoriesResponse?.data || [];
  const pagination = categoriesResponse?.pagination;
  const loading = categoriesLoading;

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

  const handleOpen = (category?: Category) => {
    setEditingCategory(category || null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
  };

  const handleSubmit = async (values: {
    name: string;
    description?: string;
    active?: boolean;
  }) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบหมวดหมู่นี้หรือไม่?")) return;
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
          จัดการหมวดหมู่
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          เพิ่มหมวดหมู่
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>รหัส</TableCell>
              <TableCell>ชื่อหมวดหมู่</TableCell>
              <TableCell>คำอธิบาย</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 3 }}
                  >
                    ไม่พบข้อมูลหมวดหมู่
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category: Category) => (
                <TableRow key={category._id}>
                  <TableCell>{category.code}</TableCell>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={category.active ? "ใช้งาน" : "ไม่ใช้งาน"}
                      color={category.active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(category)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(category._id)}
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

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <Formik
          initialValues={{
            name: editingCategory?.name || "",
            description: editingCategory?.description || "",
            active: editingCategory?.active ?? true,
          }}
          validationSchema={categorySchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form>
              <DialogTitle>
                {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
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
                    label="ชื่อหมวดหมู่"
                    fullWidth
                    error={touched.name && !!errors.name}
                    helperText={touched.name && errors.name}
                  />
                  <Field
                    as={TextField}
                    name="description"
                    label="คำอธิบาย"
                    fullWidth
                    multiline
                    rows={3}
                  />
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
    </Box>
  );
}
