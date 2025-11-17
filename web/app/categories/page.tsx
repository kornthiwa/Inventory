"use client";

import { useState, useEffect } from "react";
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
  Snackbar,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SearchIcon from "@mui/icons-material/Search";
import DataObjectIcon from "@mui/icons-material/DataObject";
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", page, limit, searchQuery],
    queryFn: () =>
      categoryService.getAll({
        page,
        limit,
        ...(searchQuery && { search: searchQuery }),
      }),
  });

  const { data: categoryDetail, isLoading: categoryDetailLoading } = useQuery({
    queryKey: ["category", viewingCategory?._id],
    queryFn: () => categoryService.getById(viewingCategory!._id),
    enabled: !!viewingCategory?._id,
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
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการสร้างหมวดหมู่";
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
        description?: string;
        active?: boolean;
      };
    }) => categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "dashboard"] });
      handleClose();
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการแก้ไขหมวดหมู่";
      setErrorMessage(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "dashboard"] });
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการลบหมวดหมู่";
      setErrorMessage(message);
    },
  });

  const mockDataMutation = useMutation({
    mutationFn: (count: number) => categoryService.generateMockData(count),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", "dashboard"] });
      setErrorMessage(null);
    },
    onError: (error: {
      response?: { data?: { message?: string } };
      message?: string;
    }) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "เกิดข้อผิดพลาดในการสร้างข้อมูลจำลอง";
      setErrorMessage(message);
    },
  });

  const handleGenerateMockData = () => {
    if (!confirm("คุณต้องการสร้างข้อมูลจำลอง 20 รายการหรือไม่?")) return;
    mockDataMutation.mutate(20);
  };

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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Reset to first page when searching
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSearchQuery(searchInput);
    setPage(1);
  };

  const handleViewDetail = (category: Category) => {
    setViewingCategory(category);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setViewingCategory(null);
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

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          จัดการหมวดหมู่
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{ display: "flex", gap: 1 }}
          >
            <TextField
              placeholder="ค้นหาหมวดหมู่..."
              variant="outlined"
              size="small"
              value={searchInput}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <Button
              type="submit"
              variant="outlined"
              size="small"
              sx={{ minWidth: "auto", px: 2 }}
            >
              ค้นหา
            </Button>
          </Box>
          <Button
            variant="outlined"
            startIcon={<DataObjectIcon />}
            onClick={handleGenerateMockData}
            disabled={mockDataMutation.isPending}
            color="secondary"
          >
            {mockDataMutation.isPending ? "กำลังสร้าง..." : "Mock Data (20)"}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            เพิ่มหมวดหมู่
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
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
                          onClick={() => handleViewDetail(category)}
                          color="info"
                          title="ดูข้อมูลเพิ่มเติม"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(category)}
                          color="primary"
                          title="แก้ไข"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(category._id)}
                          color="error"
                          title="ลบ"
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
        </>
      )}

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

      <Dialog
        open={detailOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>รายละเอียดหมวดหมู่</DialogTitle>
        <DialogContent>
          {categoryDetailLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={4}
            >
              <CircularProgress />
            </Box>
          ) : categoryDetail ? (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  รหัสหมวดหมู่
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {categoryDetail.code}
                </Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  ชื่อหมวดหมู่
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {categoryDetail.name}
                </Typography>
              </Box>
              {categoryDetail.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    คำอธิบาย
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {categoryDetail.description}
                  </Typography>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  สถานะ
                </Typography>
                <Chip
                  label={categoryDetail.active ? "ใช้งาน" : "ไม่ใช้งาน"}
                  color={categoryDetail.active ? "success" : "default"}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              ไม่พบข้อมูลหมวดหมู่
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>ปิด</Button>
          {categoryDetail && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => {
                handleCloseDetail();
                handleOpen(categoryDetail);
              }}
            >
              แก้ไข
            </Button>
          )}
        </DialogActions>
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
