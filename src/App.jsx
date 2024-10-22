import React, { useEffect, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  Fade,
  styled,
  TextField,
  InputAdornment,
} from "@mui/material";
import QRCode from "react-qr-code";
import axios from "axios";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from '@mui/icons-material/Search';
import QrCodeIcon from '@mui/icons-material/QrCode';

const theme = createTheme({
  palette: {
    primary: {
      main: "#6C63FF",
    },
    secondary: {
      main: "#FF6584",
    },
    background: {
      default: "#F0F2F5",
    },
  },
  typography: {
    fontFamily: '"Prompt", "Roboto", "Helvetica", "Arial", sans-serif',
    h2: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 30,
          textTransform: "none",
          fontSize: "1.1rem",
          padding: "12px 30px",
          transition: "all 0.3s",
        },
      },
    },
  },
});

const GradientBox = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 30,
  boxShadow:
    "0 50px 100px rgba(50, 50, 93, 0.15), 0 15px 35px rgba(50, 50, 93, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1)",
  overflow: "hidden",
  background: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(10px)",
}));

const QRCodeWrapper = styled(Box)(({ theme }) => ({
  background: "white",
  borderRadius: 20,
  padding: theme.spacing(4),
  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
}));

const SearchTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '30px',
    backgroundColor: theme.palette.background.paper,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '& fieldset': {
      borderWidth: '1px',
      borderColor: theme.palette.divider,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '12px 14px',
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  borderRadius: '30px',
  padding: '10px 20px',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: 'none',
    backgroundColor: theme.palette.primary.dark,
  },
}));

const App = () => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [fixedAmount, setFixedAmount] = useState("");
  const [countdown, setCountdown] = useState(180);
  const [partnerTransactionId, setPartnerTransactionId] = useState("");
  const [refundStatus, setRefundStatus] = useState(null);
  const [showRefundInput, setShowRefundInput] = useState(false);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  let countdownInterval;

  useEffect(() => {
    let logCheckInterval;
    if (qrCodeData) {
      countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === 1) {
            clearInterval(countdownInterval);
            clearInterval(logCheckInterval);
            setQrCodeData(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const startLogChecking = () => {
        logCheckInterval = setInterval(async () => {
          try {
            const response = await axios.get("http://localhost:3000/logs");
            const logs = response.data;

            if (logs.includes("แสกนจ่ายสำเร็จ")) {
              setPaymentStatus("SUCCESS");
              clearInterval(logCheckInterval);
              clearInterval(countdownInterval);
              setQrCodeData(null);
            }
          } catch (error) {
            console.error("Error checking logs", error);
          }
        }, 1000);
      };

      startLogChecking();
    }

    return () => {
      clearInterval(countdownInterval);
      clearInterval(logCheckInterval);
    };
  }, [qrCodeData]);

  const handleRequestQRCode = async () => {
    if (!selectedAmount) {
      setErrorMessage("กรุณาเลือกจำนวนเงิน");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setQrCodeData(null);
    setPaymentStatus(null);
    setCountdown(180);

    try {
      const response = await axios.post("http://localhost:3000/sendPayment", {
        amount: selectedAmount,
      });

      setQrCodeData(response.data.qrRawData);
      setFixedAmount(selectedAmount);
      setLoading(false);
    } catch (error) {
      setErrorMessage("เกิดข้อผิดพลาดในการสร้าง QR Code");
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  const handleAmountClick = (amount) => {
    setSelectedAmount(amount);
  };

  const handleRefund = () => {
    setShowRefundInput(true);
  };

  const submitRefund = async () => {
    if (!partnerTransactionId) {
      setErrorMessage("กรุณากรอก Partner Transaction ID");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/refund", {
        partnerTransactionId,
      });
      setRefundStatus("SUCCESS");
      setErrorMessage("");
      setSnackbarOpen(true);
    } catch (error) {
      setRefundStatus("FAILED");
      setErrorMessage("เกิดข้อผิดพลาดในการทำ Refund");
      setSnackbarOpen(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GradientBox>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Typography variant="h6" color="white" sx={{ flexGrow: 1 }}>
              QR Payment App
            </Typography>
          </Toolbar>
        </AppBar>

        <Container
          maxWidth="lg"
          sx={{ flexGrow: 1, display: "flex", alignItems: "center", py: 6 }}
        >
          <StyledCard sx={{ width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: isSmallScreen ? "column" : "row",
              }}
            >
              <CardContent
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  p: isSmallScreen ? 4 : 8,
                  textAlign: isSmallScreen ? "center" : "left",
                }}
              >
                <Typography variant="h2" color="primary" sx={{ mb: 5 }}>
                  เลือกจำนวนเงินเพื่อสร้าง QR code ชำระเงิน
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    justifyContent: "center",
                    mb: 3,
                  }}
                >
                  {[10, 20, 30, 40, 50, 100].map((value) => (
                    <Button
                      key={value}
                      variant={selectedAmount === value ? "contained" : "outlined"}
                      color="primary"
                      onClick={() => handleAmountClick(value)}
                      sx={{
                        borderRadius: "30px",
                        fontSize: "1rem",
                        minWidth: "100px",
                        height: "50px",
                        width: "125px",
                        boxShadow: 'none',
                        '&:hover': {
                          boxShadow: 'none',
                          backgroundColor: theme.palette.primary.light,
                        },
                      }}
                    >
                      {value} บาท
                    </Button>
                  ))}
                </Box>

                <SearchButton
                  variant="contained"
                  color="primary"
                  onClick={handleRequestQRCode}
                  disabled={loading || !selectedAmount}
                  size="large"
                  startIcon={<QrCodeIcon />}
                  sx={{
                    alignSelf: isSmallScreen ? "center" : "flex-start",
                    mt: 2,
                  }}
                >
                  {loading ? "กำลังสร้าง..." : "สร้าง QR Code"}
                </SearchButton>
              </CardContent>

              {qrCodeData || paymentStatus === "SUCCESS" ? (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: isSmallScreen ? 4 : 8,
                    background: "rgba(108, 99, 255, 0.05)",
                  }}
                >
                  {loading ? (
                    <CircularProgress size={60} thickness={4} />
                  ) : (
                    <Fade in={!!qrCodeData || paymentStatus === "SUCCESS"}>
                      <QRCodeWrapper>
                        {paymentStatus === "SUCCESS" ? (
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              textAlign: "center",
                              padding: theme.spacing(4),
                            }}
                          >
                            <CheckCircleIcon
                              sx={{
                                fontSize: 80,
                                color: "success.main",
                                marginBottom: theme.spacing(2),
                              }}
                            />
                            <Typography
                              variant="h4"
                              color="success.main"
                              sx={{
                                fontWeight: "bold",
                                marginBottom: theme.spacing(1),
                              }}
                            >
                              แสกนจ่ายสำเร็จ
                            </Typography>
                            <Typography
                              variant="body1"
                              color="text.secondary"
                              sx={{ fontSize: "1.2rem", marginBottom: theme.spacing(3) }}
                            >
                              ขอบคุณที่ใช้บริการ
                            </Typography>
                            {!showRefundInput ? (
                              <SearchButton
                                variant="contained"
                                color="secondary"
                                onClick={handleRefund}
                           
                                fullWidth
                              >
                                Refund
                              </SearchButton>
                            ) : (
                              <>
                                <SearchTextField
                                  fullWidth
                                  variant="outlined"
                                  placeholder="Partner Transaction ID"
                                  value={partnerTransactionId}
                                  onChange={(e) => setPartnerTransactionId(e.target.value)}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                            
                                      </InputAdornment>
                                    ),
                                  }}
                                  sx={{ mb: 2 }}
                                />
                                <SearchButton
                                  variant="contained"
                                  color="secondary"
                                  onClick={submitRefund}
                                  fullWidth
                                >
                                  ยืนยัน Refund
                                </SearchButton>
                              </>
                            )}
                            {refundStatus && (
                              <Typography
                                variant="body1"
                                color={refundStatus === "SUCCESS" ? "success.main" : "error.main"}
                                sx={{ marginTop: theme.spacing(2) }}
                              >
                                {refundStatus === "SUCCESS" ? "Refund สำเร็จ" : "Refund ล้มเหลว"}
                              </Typography>
                            )}
                          </Box>
                        ) : qrCodeData ? (
                          <>
                            <QRCode
                              value={qrCodeData}
                              size={isSmallScreen ? 180 : 220}
                            />
                            <Typography
                              variant="subtitle1"
                              sx={{
                                mt: 3,
                                textAlign: "center",
                                fontWeight: 500,
                              }}
                            >
                              สแกนเพื่อชำระเงิน
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 2 }}>
                              {`จำนวนเงินที่เลือก: ${fixedAmount} บาท`}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {`เหลือเวลา: ${Math.floor(countdown / 60)} นาที ${
                                countdown % 60
                              } วินาที`}
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body1" color="text.secondary">
                            QR Code จะปรากฏที่นี่
                          </Typography>
                        )}
                      </QRCodeWrapper>
                    </Fade>
                  )}
                </Box>
              ) : null}
            </Box>
          </StyledCard>
        </Container>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={
              errorMessage
                ? "error"
                : paymentStatus === "SUCCESS"
                ? "success"
                : "info"
            }
            variant="filled"
            sx={{ width: "100%" }}
          >
            {errorMessage || `สถานะการชำระเงิน: ${paymentStatus}`}
          </Alert>
        </Snackbar>
      </GradientBox>
    </ThemeProvider>
  );
};

export default App;