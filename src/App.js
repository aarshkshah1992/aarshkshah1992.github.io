import React, { useState } from "react";
import {
  Grid,
  Typography,
  Button,
  Paper,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import DoubleSlit from "./components/DoubleSlit";
import "./App.css";
import { Visibility } from "@mui/icons-material";

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [isEmitting, setIsEmitting] = useState(false);
  const [isDetectorOn, setIsDetectorOn] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");

  const steps = [
    {
      label: "Introduction",
      description: `<p>Welcome to the <strong>Double-Slit Experiment Simulation</strong>. This interactive simulation allows you to explore one of the most fascinating phenomena in quantum mechanics, demonstrating how particles like electrons can exhibit both wave-like and particle-like properties. Use the controls below to start the simulation. You can toggle the detector to observe how measurement affects the behavior of particles and the resulting pattern on the screen.</p>`,
    },
    {
      label: "Wave Behavior Without Observation",
      description: `<p>With the detector <strong>off</strong>, particles are not observed as they pass through the slits. In this setup, each particle acts as a wave, passing through <strong>both slits simultaneously</strong> and interfering with itself.</p>
      <h3>Observations:</h3>
      <ul>
        <li>An interference pattern gradually appears on the detection screen, characterized by alternating bright and dark fringes.</li>
        <li>This pattern indicates areas of constructive and destructive interference, showing where particles are more or less likely to be detected.</li>
      </ul>
      <h3>Explanation:</h3>
      <p>The wavefunction of each particle spreads out and passes through both slits, creating overlapping waves that interfere with each other. This interference affects the probability distribution of where particles will be detected on the screen, resulting in the observed pattern. This demonstrates the principle of <strong>quantum superposition</strong>, where particles can exist in multiple states or locations simultaneously.</p>`,
    },
    {
      label: "Particle Behavior With Observation",
      description: `<p>When the detector is <strong>on</strong>, particles are observed as they pass through the slits. In this setup, the act of measurement collapses the particle's wavefunction, forcing it to choose a definite path through <strong>one slit or the other</strong>.</p>
      <h3>Observations:</h3>
      <ul>
        <li>The interference pattern disappears, and instead, two distinct bands form on the detection screen corresponding to the two slits.</li>
        <li>The distribution of particles in each band reflects the probability of a particle passing through each slit.</li>
      </ul>
      <h3>Explanation:</h3>
      <p>By observing the particles, we disturb their quantum state, causing the wavefunction to collapse into a single state. This means each particle behaves like a classical particle, going through only one slit. The absence of the interference pattern indicates that the wave-like behavior has been altered by measurement, illustrating the <strong>observer effect</strong> in quantum mechanics.</p>`,
    },
    {
      label: "Wavefunction Collapse and Probabilities",
      description: `<p>The <strong>wavefunction collapse</strong> is a fundamental concept in quantum mechanics. It describes how the act of measurement affects a quantum system, forcing it from a superposition of states into a single state.</p>
      <h3>Implications:</h3>
      <ul>
        <li>When unobserved, particles exhibit <strong>wave-like properties</strong>, leading to an interference pattern.</li>
        <li>Observation causes particles to behave as <strong>classical particles</strong>, eliminating the interference pattern.</li>
        <li>The slit through which a particle passes is determined probabilistically, not predetermined.</li>
        <li>This demonstrates the <strong>inherent uncertainty</strong> and probabilistic nature of quantum systems.</li>
      </ul>
      <p>Toggle the detector to see how measurement influences the behavior of particles and the resulting patterns. This highlights the significant role of the observer in quantum mechanics.</p>`,
    },
    {
      label: "Conclusion",
      description: `<p>The double-slit experiment reveals the dual nature of particles and the profound effects of observation on quantum systems. It challenges our classical understanding of physics by showing that particles can behave as waves and that measurement affects outcomes.</p>
      <p>Through this simulation, you have seen how particles behave differently when observed versus unobserved, emphasizing the key concepts of <strong>superposition</strong>, <strong>wave-particle duality</strong>, and the <strong>observer effect</strong>. This experiment lays the foundation for understanding the strange and fascinating world of quantum mechanics.</p>`,
    },
  ];

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    } else {
      setActiveStep(0);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsEmitting(false);
    setIsDetectorOn(false);
  };

  return (
    <div style={{ flexGrow: 1, padding: "20px" }}>
      <Grid container spacing={2}>
        {/* Title and Stepper */}
        <Grid item xs={12}>
          <Typography variant="h4" align="center" gutterBottom>
            Double-Slit Experiment Simulation
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Grid>
        {/* Animation and Controls */}
        <Grid item xs={12} md={8} style={{ textAlign: "center" }}>
          <DoubleSlit isEmitting={isEmitting} isDetectorOn={isDetectorOn} setTooltipContent={setTooltipContent} />
          <div
            className="controls"
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Button
              variant="contained"
              color={isEmitting ? "secondary" : "primary"}
              onClick={() => {
                setIsEmitting(!isEmitting);
                if (isEmitting) {
                  setIsDetectorOn(false);
                }
              }}
              style={{ marginRight: "10px" }}
            >
              {isEmitting ? "Stop Emission" : "Start Emission"}
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={isDetectorOn}
                  onChange={() => setIsDetectorOn(!isDetectorOn)}
                  color="primary"
                  disabled={!isEmitting}
                />
              }
              label="Activate Detector"
            />
          </div>
        </Grid>
        {/* Step Content */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} className="scroll-container">
            <div className="scroll-content">
              <Typography variant="h5" className="scroll-title">
                {steps[activeStep].label}
              </Typography>
              <Typography
                variant="body1"
                component="div"
                dangerouslySetInnerHTML={{
                  __html: steps[activeStep].description,
                }}
              />
            </div>
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                style={{ marginRight: "10px" }}
              >
                Back
              </Button>
              <Button variant="contained" color="primary" onClick={handleNext}>
                {activeStep === steps.length - 1 ? "Start Over" : "Next"}
              </Button>
            </div>
          </Paper>
        </Grid>
      </Grid>
      <Typography variant="body2" style={{ marginTop: "10px", minHeight: "20px" }}>
        <Paper
          elevation={3}
          style={{
            marginTop: "20px",
            padding: "10px",
            backgroundColor: isDetectorOn ? "#E3F2FD" : "transparent",
            transition: "background-color 0.3s ease",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body1"
            style={{
              fontWeight: "500",
              color: isDetectorOn ? "#1565C0" : "transparent",
              transition: "color 0.3s ease",
              display: "flex",
              alignItems: "center",
            }}
          >
            {isDetectorOn && <Visibility style={{ marginRight: "8px" }} />}
            {tooltipContent}
          </Typography>
        </Paper>
      </Typography>
    </div>
  );
}

export default App;