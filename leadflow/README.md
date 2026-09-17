# LeadFlow 🚀
### Production-Ready MERN Stack Lead Finder, CRM & Gmail Outreach System

LeadFlow is an end-to-end web application that allows you to upload spreadsheets (`.xlsx`, `.xls`, `.csv`) containing local businesses, automatically identifies businesses that lack an active website, isolates them as qualified leads, deduplicates across multiple business signals, connects your Gmail account via Google OAuth 2.0, and empowers you to send personalized cold outreach pitches with real-time email tracking and follow-up management.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, React Router v6, Axios, React Hot Toast.
- **Backend**: Node.js, Express.js REST API, Mongoose ODM, SheetJS (`xlsx`), Multer, `googleapis` (Gmail API + OAuth 2.0), `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`.
- **Security**: AES-256-GCM token encryption at rest, Helmet security headers, rate limiting, formula injection prevention, and strict multi-tenant isolation.
- **Database**: MongoDB Atlas (Free Tier) or local MongoDB instance.

---

## ⚡ Core Workflow

```
 XLSX Upload
      ↓
 Parse Businesses (SheetJS)
      ↓
 Website Filtering (Empty, N/A, Google Maps URLs classified as NO WEBSITE)
      ↓
 Lead Qualification & Multi-Signal Deduplication (Name, Phone, Email, City)
      ↓
 Store in MongoDB Atlas (Multi-Tenant Data Isolation)
      ↓
 Connect Google Gmail (OAuth 2.0 / AES-256-GCM Encrypted Credentials)
      ↓
 Compose Personalized Outreach ({{business_name}}, {{contact_name}}, {{city}})
      ↓
 Send Safely via Gmail API (Daily Quota Protection & Backoff Delays)
      ↓
 Track Email History & Review Due Follow-ups (Human-in-the-Loop)
```

---

## 📋 Requirements

- **Node.js**: `v18.0.0` or higher (tested on `v20.x`)
- **npm**: `v9.0.0` or higher
- **MongoDB**: MongoDB Atlas (Free Tier cluster) or local `mongodb://localhost:27017`
- **Google Cloud Console account** (Free tier for Gmail API OAuth)

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Setup Directories
```bash
git clone <repository-url>
cd leadflow
```

### 2. Configure Environment Variables
Copy `.env.example` into `server/.env`:
```bash
cp .env.example server/.env
```

Review and configure `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/leadflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/gmail/callback
ENCRYPTION_KEY=your_32_character_encryption_secret_key!
DAILY_EMAIL_LIMIT=50
```

### 3. Install Dependencies & Start Server
```bash
cd server
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

### 4. Install Dependencies & Start Frontend Client
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
The Vite development server will start on `http://localhost:5173`.

---

## ☁️ Free-Tier Setup Guides (₹0 Software Cost)

### MongoDB Atlas Free Tier Setup
1. Visit [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
2. Click **Build a Database** and select the **M0 Free** cluster (512 MB storage, shared cluster).
3. Select your preferred cloud region and click **Create**.
4. In **Database Access**, create a database user with read/write access (e.g., `leadflow_user`).
5. In **Network Access**, add IP address `0.0.0.0/0` (or your current development IP address).
6. Click **Connect** &gt; **Drivers** (Node.js) and copy the connection string into `server/.env` under `MONGODB_URI`:
   ```
   MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/leadflow?retryWrites=true&w=majority
   ```

### Google Cloud & Gmail API Setup
Standard usage of the Gmail API is free of charge under Google's standard quotas:
1. Visit the [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project named **LeadFlow**.
3. Go to **APIs & Services** &gt; **Library** and search for **Gmail API**. Click **Enable**.
4. Go to **APIs & Services** &gt; **OAuth consent screen**:
   - User Type: **External**
   - Fill App name ("LeadFlow") and user support email.
   - Under **Scopes**, add:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/userinfo.email`
   - Under **Test users**, add your own Gmail address.
5. Go to **APIs & Services** &gt; **Credentials**:
   - Click **Create Credentials** &gt; **OAuth client ID**.
   - Application type: **Web application**.
   - Authorized redirect URIs: `http://localhost:5000/api/gmail/callback`.
6. Copy the **Client ID** and **Client Secret** into `server/.env`.
7. In the LeadFlow UI, navigate to **Settings** and click **Connect Gmail** to authorize.

---

## 🧪 Testing & Verification

Run the automated test suite covering normalizers, spreadsheet parsing, website filtering, and security:
```bash
cd server
npm test
```

To generate a sample spreadsheet for testing:
```bash
cd server
node utils/sampleDataGenerator.js
```
The sample file will be created at `sample_data/sample_businesses.xlsx` containing:
- Businesses with valid websites
- Businesses with empty/null/N/A websites (qualified as leads)
- Businesses where Google Maps URLs were placed in the website column (detected and classified as leads)
- In-file duplicate records
- Varied categories and phone number formats

---

## 🛡️ Security Features

1. **OAuth Credential Encryption**: Google refresh and access tokens are encrypted with AES-256-GCM using a server-side encryption key. Tokens are never exposed to the frontend.
2. **Untrusted Spreadsheet Handling**: Formula and macro execution is disabled (`cellFormula: false`) to neutralize spreadsheet injection attacks.
3. **No Passwords Stored**: Gmail passwords are never collected; authentication relies exclusively on official Google OAuth 2.0 tokens.
4. **Data Isolation**: Multi-tenant architecture guarantees that all leads, contacts, templates, and history are scoped strictly to the authenticated `userId`.
5. **Rate Limiting & Safety**: Daily sending quotas and exponential backoff protects your email sender reputation and complies with Google's API policies.

---

## 📦 Production Deployment

Build the optimized client bundle:
```bash
cd client
npm run build
```
Express will automatically serve the production build from `client/dist` when accessed directly through the Node server:
```bash
cd server
NODE_ENV=production node server.js
```

