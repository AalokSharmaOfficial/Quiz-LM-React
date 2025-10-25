# 1. Project Title: React Quiz LM (v5.1)

A modern, feature-rich quiz application built with React and Vite, designed for comprehensive exam preparation with a polished UI and an advanced, data-driven filtering system. Deployed with a professional CI/CD workflow.

---
---

# ⭐ The Golden Rule: All Development Happens in `src/` ⭐

**ATTENTION ALL DEVELOPERS:** This project uses a specific dual-environment workflow. To prevent build failures and merge conflicts, you **MUST** follow this rule.

### 1. The Two Environments

This repository maintains two parallel versions of the application:

* **`src/` Directory (Your Workspace):** This is the standard, modular Vite environment. All development, testing, and pull requests happen here. This is the source of truth for our production build.
* **Root Files (Owner's Zone):** The `index.tsx` and `index.css` files in the root directory. These are a special, *monolithic* (single-file) build used *only* for a live demo environment in Google AI Studio.

### 2. Your Core Responsibility: Stay Inside `src/`

Your work should **ONLY** be done inside the `src/` directory.

* **DO:** Make all your changes to components, logic, and styles inside `src/`. (e.g., `src/App.tsx`, `src/components/Quiz.tsx`, `src/main.css`).
* **DO NOT:** Edit the root-level `index.tsx` or `index.css` files for *any reason*.

The project owner is solely responsible for syncing the approved changes from `src/` into the root monolithic files. Any direct edits you make to them will be overwritten and will break the live demo.

### 3. Example Workflow

* ✅ **CORRECT:**
    1.  You need to add a new feature.
    2.  You create a new file: `src/components/NewFeature.tsx`.
    3.  You add styles to: `src/main.css`.
    4.  You import the feature in: `src/App.tsx`.
    5.  You commit *only* the files within the `src/` directory.

* ❌ **INCORRECT:**
    1.  You add the new feature in `src/components/NewFeature.tsx`.
    2.  You then open the **root `index.tsx`** and try to paste your new component code into it.
    3.  You open the **root `index.css`** and paste your new styles.
    *(This will cause conflicts and will be rejected.)*

### 4. What *Can* You Edit at the Root Level?

You are still free to modify other root-level *configuration* files as needed for your task (e.g., `index.html`, `vite.config.ts`, `package.json`).

**TL;DR: Do all your work in `src/`. Never touch the root `index.tsx` or `index.css` files.**

## 2. Live Demo

The application is automatically deployed to GitHub Pages. The live version can be accessed at:

**[https://aaloksharmaofficial.github.io/Quiz-LM-React/](https://aaloksharmaofficial.github.io/Quiz-LM-React/)**

---

## 3. Core Features

### Advanced Dynamic Quiz Customization
*   **Modern UI/UX:** A clean, professional, and intuitive interface that organizes filters for an enhanced user experience.
*   **Quick Start:** Instantly begin a quiz with predefined difficulties.
*   **8-Point Advanced Filtering:** Create specific quizzes by filtering a large question bank using eight distinct controls.
*   **Cascading Logic & Smart Filter Counts:** Intelligent filters that update dynamically based on user selections.

### Immersive Quiz Experience
*   **Focused Layout:** A sleek card-based design with sticky headers and independent scrolling.
*   **Collapsible Statistics Panel:** Maximize screen space for questions by hiding the stats panel.
*   **Rich HTML Question Rendering:** Correctly renders complex "Match the following" style questions.
*   **Bilingual Support:** Questions and options are displayed in both English and Hindi.
*   **Detailed Explanations & Instant Feedback:** Get immediate, color-coded feedback and rich, Markdown-formatted explanations.
*   **Right-Side Navigation Panel:** A collapsible grid view of all questions, color-coded by status and organized into foldable groups of 50.

### Performance Analysis & Review
*   **Visual Score Summary:** A detailed breakdown of performance with a dynamic donut chart.
*   **Share Results:** Download a PNG image of your score card.
*   **Comprehensive Review Module:** A dedicated, filterable screen to review all questions with full context.

### User Personalization
*   **Settings Panel:** Customize the user experience with Dark Mode and feature toggles for animations, sound, and haptic feedback.
*   **Persistence:** All user settings and bookmarks are saved in the browser's LocalStorage.

---

## 4. Deployment Workflow (Vite + GitHub Actions + GitHub Pages)

The project is configured with a professional Continuous Integration/Continuous Deployment (CI/CD) pipeline using GitHub Actions to deploy to GitHub Pages. The workflow is defined in `.github/workflows/deploy.yml` and functions as follows:

1.  **Trigger:** The workflow is automatically triggered on every `git push` to the `main` branch.
2.  **Setup:** A fresh virtual environment (Ubuntu) is spun up. It checks out the repository code and installs the correct Node.js version.
3.  **Build:**
    *   `npm install` is run to install all project dependencies.
    *   `npm run build` is executed. This command uses Vite to bundle, optimize, and minify the React application into static HTML, CSS, and JavaScript files.
    *   The final production-ready assets are placed in a `./dist` directory.
4.  **Deploy:**
    *   A specialized GitHub Action (`peaceiris/actions-gh-pages`) takes the contents of the `./dist` directory.
    *   It pushes these static files to a special branch named `gh-pages`.
5.  **Go Live:** The repository is configured to serve a website from the `gh-pages` branch. As soon as the new files are pushed, the live website is updated automatically.

**In short: a push to `main` automatically updates the live site.**

---

## 5. How to Add New Questions

Updating the question bank is now a streamlined process. Any changes committed to the `public/questions.json` file in the `main` branch on GitHub will automatically be reflected on the live site. Ensure you follow the `Content-creation-guidelines.txt` precisely.

### Method 1: The Recommended Local Workflow (Safe & Tested)
This is the safest method as it allows you to test your changes and ensure the JSON file is valid before deploying.
1.  **Edit Locally:** Open the project on your computer and add your new question objects to the `public/questions.json` file.
2.  **Test Your Changes:** Open your terminal, navigate to the project directory, and run the development server:
    ```bash
    npm run dev
    ```
    Open the local URL (e.g., `http://localhost:5173`) in your browser. Verify that the app loads and your new questions appear correctly. This step is crucial to catch any JSON syntax errors.
3.  **Commit and Push:** Once you confirm everything works, stop the server (Ctrl+C). Then, use the following git commands in your terminal:
    ```bash
    # Stage the changes
    git add public/questions.json

    # Commit the changes with a clear message
    git commit -m "feat: Add 50 new Polity questions"

    # Push the commit to GitHub to trigger deployment
    git push
    ```
4.  **Done!** GitHub Actions will now automatically build and deploy your updated site.

### Method 2: The GitHub Website Workflow (Quick & Convenient)
This method is faster for simple additions but carries the risk of deploying a broken file if there are syntax errors.
1.  **Navigate to the file:** Go to your project's repository on the GitHub website. Click on the `public` folder, then click on the `questions.json` file.
2.  **Edit the file:** Click the pencil icon ("Edit this file") on the top right.
3.  **Add questions:** Carefully add your new question objects to the JSON array, ensuring all commas and brackets are correct.
4.  **Commit changes:** Scroll to the bottom. In the "Commit changes" box, type a descriptive commit message (e.g., "docs: Add 10 new Geography questions"). Ensure "Commit directly to the `main` branch" is selected and click the green "Commit changes" button.
5.  **Done!** This will trigger the deployment.

> #### Professional Advice
> The GitHub website method is convenient for quick, simple content edits. However, it's **highly recommended to always test your changes locally (Method 1)** to prevent deploying a broken application due to a small syntax error in the JSON file.

---

## 6. Technology Stack & Architecture

*   **Build Tool:** Vite
*   **Frontend:** React, TypeScript, CSS3
*   **Animations:** Framer Motion
*   **Data Source:** Static `questions.json`

---

## 7. Setup and Run Locally

1.  Clone the repository: `git clone <your-repo-url>`
2.  Navigate into the directory: `cd [project-directory]`
3.  Install dependencies: `npm install`
4.  Start the development server: `npm run dev`
5.  Open your browser and navigate to the local URL provided by Vite.

---

## 8. Database Population (One-time Setup)

If you are setting up the project with a new database backend (e.g., Neon), a script is provided to generate the necessary SQL.

1.  **Run the Script:** After setting up your project locally, run the following command in your terminal:
    ```bash
    npm run generate-sql
    ```
2.  **Output File:** This command will read `public/questions.json` and create a new file named `public/populate_db.sql` containing all the necessary SQL INSERT statements.
3.  **Populate Database:** Copy the entire content of `public/populate_db.sql`, paste it into your database's SQL editor, and run the script. This will populate your `questions` table.