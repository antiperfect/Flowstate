# Flowstate

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/react-v19.0.0-blue) ![Vite](https://img.shields.io/badge/vite-v6.0.5-purple) ![Tailwind](https://img.shields.io/badge/tailwindcss-v3.4.17-sky)

**Flowstate** is a focus-centric to-do list application designed to help you maintain your "flow." It combines task management with an integrated focus timer, activity tracking, and a fluid, animated interface to keep you engaged and productive.

> *"to-do list webapp by shashank for shashank"*

👉 **[Try the Live Webapp](https://flowstate-sable.vercel.app/)**

## ✨ Features

* **Task Management**:
    * Add, complete, and delete tasks.
    * **Priority Levels**: Classify tasks as High (Pink/Rose), Medium (Amber/Orange), or Low (Emerald/Teal) with visual color coding.
    * **Search**: Filter tasks instantly by text.
    * **Persistence**: All tasks and history are saved locally in your browser.
* **Integrated Focus Timer**:
    * Select any task to start a dedicated timer.
    * Preset durations (25m, 45m, 60m) or custom input.
    * Visual countdown with play/pause/reset controls.
    * **Sound Effects**: Custom audio feedback for clicks, task completion, timer ticks, and alarms using the Web Audio API.
* **Activity Tracking**:
    * Visual **Bar Chart** displaying your task completion history over the last 7 days.
* **Advanced UI/UX**:
    * **Liquid Background**: Animated, moving blobs create a calming, dynamic backdrop.
    * **Glassmorphism**: Modern, translucent UI components.
    * **Custom Date Picker**: Unique circular time slider and calendar interface for setting due dates.
    * **Responsive Design**: Fully functional on desktop and mobile devices.

## 🛠️ Tech Stack

* **Framework**: [React](https://react.dev/) (v19)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Audio**: Native Web Audio API (No external sound libraries)

## 🚀 Getting Started

Follow these steps to run the project locally.

### Prerequisites

* Node.js (v18 or higher recommended)
* npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/antiperfect/flowstate.git](https://github.com/antiperfect/flowstate.git)
    cd flowstate
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Open the app**
    Open your browser and navigate to the URL provided in the terminal (usually `http://localhost:5173`).
