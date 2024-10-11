import React, { useState, useEffect, useCallback } from "react";
import {
  Grid,
  Typography,
  Button,
  Paper,
  Switch,
  FormControlLabel,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
} from "@mui/material";
import { styled } from "@mui/system";
import { motion, AnimatePresence } from "framer-motion";
import DoubleSlit from "./components/DoubleSlit";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Visibility, VisibilityOff } from "@mui/icons-material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// Custom theme
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00b0ff",
    },
    secondary: {
      main: "#ff4081",
    },
    background: {
      default: "#0a1929",
      paper: "#132f4c",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0bec5",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    body1: {
      fontSize: "1.1rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
  },
});

// Styled components
const StyledPaper = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(2),
  background: "linear-gradient(45deg, #132f4c 30%, #173a5e 90%)",
  boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
  borderRadius: theme.shape.borderRadius,
}));

const GlowingButton = styled(motion.button)(({ theme }) => ({
  background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
  border: 0,
  borderRadius: 3,
  boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
  color: "white",
  height: 48,
  padding: "0 30px",
  margin: theme.spacing(1),
  cursor: "pointer",
  fontFamily: theme.typography.fontFamily,
  fontSize: "1rem",
  fontWeight: "bold",
}));

const ExplanationText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  textShadow: "0 0 10px rgba(255, 255, 255, 0.3)",
  marginBottom: theme.spacing(2),
}));

function App() {
  const [isEmitting, setIsEmitting] = useState(false);
  const [isDetectorOn, setIsDetectorOn] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [particleDistribution, setParticleDistribution] = useState(
    Array(20).fill(0),
  );
  const [showBarChart, setShowBarChart] = useState(false);
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    setAudioContext(new (window.AudioContext || window.webkitAudioContext)());
  }, []);

  const playSound = useCallback(
    (frequency, duration) => {
      if (audioContext) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime,
        );
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + duration,
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + duration);
      }
    },
    [audioContext],
  );

  const handleEmissionToggle = () => {
    setIsEmitting(!isEmitting);
    if (isEmitting) {
      setIsDetectorOn(false);
      setParticleDistribution(Array(20).fill(0));
      setShowBarChart(false);
    }
  };

  const handleDetectorToggle = () => {
    setIsDetectorOn(!isDetectorOn);
    setParticleDistribution(Array(20).fill(0));
    setShowBarChart(false);
  };

  useEffect(() => {
    if (!isDetectorOn) {
      setShowBarChart(false);
    }
  }, [isDetectorOn]);

  const chartData = {
    labels: Array(20).fill(""),
    datasets: [
      {
        label: "Top Slit",
        data: particleDistribution.slice(0, 10),
        backgroundColor: "rgba(255, 99, 132, 0.8)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Bottom Slit",
        data: particleDistribution.slice(10),
        backgroundColor: "rgba(53, 162, 235, 0.8)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#ffffff",
        },
      },
      tooltip: {
        enabled: false,
      },
      title: {
        display: true,
        text: "Particle Detection Distribution",
        color: "#ffffff",
        font: {
          size: 16,
          weight: "bold",
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Particles Detected",
          color: "#ffffff",
          font: {
            size: 14,
            weight: "bold",
          },
        },
        ticks: {
          color: "#ffffff",
        },
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          padding: 2,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            style={{
              color: "#00b0ff",
              textShadow: "0 0 10px rgba(0, 176, 255, 0.5)",
            }}
          >
            Quantum Double-Slit Experiment
          </Typography>
        </motion.div>
        <Grid container spacing={2} sx={{ flexGrow: 1 }}>
          <Grid item xs={12} md={8}>
            <StyledPaper
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              elevation={3}
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <DoubleSlit
                isEmitting={isEmitting}
                isDetectorOn={isDetectorOn}
                setTooltipContent={setTooltipContent}
                setParticleDistribution={setParticleDistribution}
                setShowBarChart={setShowBarChart}
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 2,
                }}
              >
                <GlowingButton
                  onClick={handleEmissionToggle}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isEmitting ? "Stop Emission" : "Start Emission"}
                </GlowingButton>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isDetectorOn}
                      onChange={handleDetectorToggle}
                      color="secondary"
                      disabled={!isEmitting}
                    />
                  }
                  label="Activate Detector"
                />
              </Box>
            </StyledPaper>
          </Grid>
          <Grid item xs={12} md={4}>
            <StyledPaper
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              elevation={3}
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Typography
                variant="h6"
                style={{ color: "#00b0ff", marginBottom: "10px" }}
              >
                Experiment Status
              </Typography>
              <Box
                sx={{
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDetectorOn ? "detector-on" : "detector-off"}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ExplanationText
                      variant="body1"
                      style={{
                        fontWeight: "500",
                        color: isDetectorOn ? "#ff4081" : "#00b0ff",
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "15px",
                      }}
                    >
                      {isDetectorOn ? (
                        <>
                          <Visibility style={{ marginRight: "8px" }} />
                          Detector Active: Wave function collapses, particle
                          chooses one slit.
                        </>
                      ) : (
                        <>
                          <VisibilityOff style={{ marginRight: "8px" }} />
                          Detector Inactive: Particle behaves as a wave, passing
                          through both slits.
                        </>
                      )}
                    </ExplanationText>
                    <ExplanationText variant="body2">
                      {isEmitting
                        ? isDetectorOn
                          ? "In this configuration, we are observing the particle behavior of quantum entities. Each particle is forced to choose a definite path through either the top or bottom slit. This measurement causes the wave function to collapse, resulting in a classical particle-like behavior. The interference pattern disappears, and we see two distinct bands on the screen."
                          : "Now we're witnessing the wave nature of quantum particles. Without observation, each particle interferes with itself, passing through both slits simultaneously as a probability wave. This quantum superposition leads to the formation of an interference pattern on the screen, showcasing the wave-like properties of matter."
                        : "The experiment is currently not running. Press 'Start Emission' to begin observing quantum phenomena."}
                    </ExplanationText>
                    <ExplanationText variant="body2">
                      {isEmitting
                        ? isDetectorOn
                          ? "This demonstrates the 'observer effect' in quantum mechanics, where the act of measurement fundamentally alters the behavior of the system. It highlights the probabilistic nature of quantum mechanics and the role of observation in determining outcomes. To observe wave-like behavior, try turning off the detector."
                          : "This phenomenon, known as wave-particle duality, is a fundamental principle of quantum mechanics. It shows that quantum entities can exhibit both wave-like and particle-like properties, depending on how they are measured. The interference pattern we observe is a direct manifestation of the quantum wave function. To see particle-like behavior, try activating the detector."
                        : "Prepare to explore the fascinating world of quantum mechanics, where the very act of observation can dramatically change the outcome of an experiment. Click 'Start Emission' to begin and observe wave-like behavior."}
                    </ExplanationText>
                  </motion.div>
                </AnimatePresence>
                <AnimatePresence>
                  {isDetectorOn && showBarChart && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.5 }}
                      style={{ overflow: "hidden" }}
                    >
                      <Box sx={{ height: "200px", mt: 2 }}>
                        <Bar data={chartData} options={chartOptions} />
                      </Box>
                      <ExplanationText
                        variant="body2"
                        style={{ marginTop: "10px" }}
                      >
                        This chart illustrates the probabilistic nature of
                        quantum mechanics in action. Each electron, when
                        detected, appears to have gone through either the top or
                        bottom slit, but its choice is entirely random. While we
                        can't predict which slit any individual electron will
                        choose, over many detections we observe a roughly 50/50
                        distribution between the two slits. This randomness is
                        fundamental to quantum systems, not just a limitation of
                        our measurement. Notice how the particles cluster around
                        two distinct regions, corresponding to the two slits.
                        This is in stark contrast to the interference pattern we
                        would see if the detector were off, further illustrating
                        the impact of measurement on quantum systems. To
                        compare, try turning off the detector and observe the
                        difference in particle behavior.
                      </ExplanationText>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </StyledPaper>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
}

export default App;
