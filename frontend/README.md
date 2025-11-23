# Frontend - AI Agent Platform

React + Vite frontend for the AI Agent Platform.

## Structure

```
frontend/src/
├── components/          # Reusable components
│   ├── Layout.jsx      # Main layout with header/footer
│   ├── AgentCard.jsx   # Agent card display
│   ├── StepIndicator.jsx # Wizard step indicator
│   ├── builder/        # Agent builder components
│   │   ├── AgentTypeSelection.jsx
│   │   ├── BasicConfiguration.jsx
│   │   ├── FunctionConfiguration.jsx
│   │   ├── VoiceConfiguration.jsx
│   │   ├── TestConfiguration.jsx
│   │   └── ReviewAndDeploy.jsx
│   └── modals/         # Modal dialogs
│       ├── CalComFunctionModal.jsx
│       └── CustomFunctionModal.jsx
├── pages/              # Page components
│   ├── Dashboard.jsx   # Main dashboard
│   ├── AgentBuilder.jsx # Agent creation wizard
│   ├── AgentDetail.jsx  # Agent details page
│   └── TestAgent.jsx    # Testing interface
├── App.jsx             # Root component with routing
├── main.jsx           # Entry point
└── index.css          # Global styles with Tailwind
```

## Key Features

### Dashboard
- Agent overview cards
- Statistics display
- Quick actions

### Agent Builder Wizard
- Step 1: Type selection (Chatbot/Voice)
- Step 2: Basic configuration
- Step 3: Function setup
- Step 4: Voice settings (voice agents only)
- Step 5: Twilio configuration (voice agents only)
- Step 6: Review and deploy

### Testing Interface
- Real-time chat for chatbots
- Live call transcripts for voice agents
- Function execution tracking
- Call controls (start/end)

## Styling

### Tailwind Configuration
- Custom color palette (primary, secondary)
- Custom animations (gradient, float, slide-up)
- Dark mode support
- Responsive breakpoints

### Design System
- Glass morphism effects
- Gradient backgrounds
- Smooth transitions
- Consistent spacing

## State Management

Using React hooks and local state. For larger apps, consider:
- Zustand (lightweight state management)
- React Query (API state management)
- Context API (global state)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create `.env` file if needed:
```env
VITE_BACKEND_URL=http://localhost:3000
```

## Customization

### Colors
Edit `tailwind.config.js` to change the color scheme:
```javascript
colors: {
  primary: { /* your colors */ },
  secondary: { /* your colors */ }
}
```

### Animations
Add custom animations in `tailwind.config.js` under `extend.animation`.

### Components
All components are modular and can be customized independently.
