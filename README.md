<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1gekEOtlCGpQHGklMZpL_xXo-60_ex3vj

## Run Locally

**Prerequisites:**

- Node.js 18 or newer
- npm 9+

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root with your OCR.Space API key so the app can make authenticated OCR requests:

```
VITE_OCR_SPACE_API_KEY=your_api_key_here
```

> **Note:** If you skip this step the bundled demo key is used, but OCR requests will be heavily rate limited and may fail during busy periods.

### 3. Start the Vite dev server

```bash
npm run dev
```

Vite will print a local URL (typically <http://localhost:5173>) you can open in your browser. The app automatically reloads when you edit files.

### 4. Optional commands

- **Type-check the project**

  ```bash
  npx tsc --noEmit
  ```

- **Create a production build**

  ```bash
  npm run build
  ```

- **Preview the production build locally**

  ```bash
  npm run preview
  ```
