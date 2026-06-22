# ViaGraph 🚐

> **Web-Based Transportation Guide & Simulation Application for Iligan City**  
> *A professional commuter assistant and transportation management console built for MSU-IIT commuters, visitors, and transit administrators.*

---

## 📌 Project Overview
**ViaGraph** is an interactive, web-based routing simulator designed to guide commuters through the public utility jeepney (PUJ) and minibus transit routes of Iligan City. By implementing Dijkstra’s shortest-path algorithm alongside network transfer penalties, ViaGraph provides commuters with optimal travel routes, step-by-step transfer guidance, and dynamic fare estimations (both regular and discounted). 

For administrators and transit planners, the app includes a secure, feature-rich **Admin Dashboard** to coordinate landmarks, manage route segments, recalculate global fare schedules, and upload GeoJSON spatial coordinate files.

---

## ✨ Core Features

### 👤 Commuter (User Role)
*   **Intelligent Trip Planning:** Select any origin and destination node within Iligan City proper to generate route guidance.
*   **Transfer Optimization:** The algorithm distinguishes between standard shortest-path distance (Dijkstra) and recommended routes that minimize complex vehicle transfers.
*   **Commuter Fare Reference:** Displays estimated fares per segment based on standard LTFRB matrices. Provides ceiled discounted rates (20%) for students, seniors, and PWDs.
*   **Interactive Maps:** Visualizes routes on dynamic map layers using Leaflet. Supports toggling between **Standard** map tiles and **Satellite** imagery.
*   **Visual Journey Preview:** Features an animated transit marker (`🚐` / `🚶`) that plays along the coordinate path, alongside direction indicators (arrows) and hoverable tooltips.
*   **Account Settings & Recovery:** Allows display name editing, secure password resets, and a multi-channel **Account Recovery** wizard (via Email link, security questions, or username-to-email search).

### 👑 Administrator (Admin Role)
*   **Route Blocks Management:** Add, edit, or archive segment lines connecting geographic stops. Features an interactive coordinate drawing canvas and **Version History** tracking for audit review.
*   **Locations (Nodes) Management:** Coordinate intersections and landmarks using a map-click listener to auto-detect and fill Latitude and Longitude coordinates.
*   **Jeepney Lines Console:** Customize franchise route names and assign official HEX map rendering colors.
*   **Dynamic Fare Matrix:** Adjust base fares, base distance thresholds, succeeding distance rates, and discount percentages per vehicle type (*Jeepney*, *Mini Bus*, *Bus*). Recalculates all route blocks instantly.
*   **GeoJSON Route Measurer & Importer:** Drag and drop geographic `.geojson` files to calculate path lengths. Importers auto-generate Source and Target nodes if they do not exist.
*   **Archive Manager:** Rather than deleting database rows, admins can *Archive* data assets. A restore utility is provided to safely re-integrate archived locations or segments.
*   **Audit Trail logs:** Tracks administrator and user modifications categorized by action category (User Actions vs Admin Actions).
*   **Role Administration:** Elevate or demote user access privileges.

---

## 🛠️ Technology Stack
*   **Core Framework:** [Next.js 15](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
*   **Styling & UI:** Vanilla CSS, Tailwind CSS, Lucide React Icons, and Shadcn/ui Components
*   **Mapping Engine:** [Leaflet](https://leafletjs.org/) & [React Leaflet](https://react-leaflet.js.org/) (OpenStreetMap & Esri World Imagery tiles)
*   **Database Management:**
    *   **Firebase Firestore:** Used for fast document storage and client-side graph caching.
    *   **MySQL:** Used for relational user profiles, account recovery secrets, session audit logs, and version control tables.
*   **Authentication & Security:** JWT session management via secure HttpOnly cookies and Bcrypt password hashing.

---

## 📁 Repository Directory Structure
*   `src/` - Entire application source code.
    *   `src/app/` - Routing structure (Pages, APIs, auth handling).
    *   `src/components/` - Map renderers, admin tables, forms, and custom navigation UI.
    *   `src/contexts/` - Global authentication and database initialization context.
    *   `src/lib/` - Dijkstra algorithms, database pools, and server actions.
*   `public/` - Static assets (logos, final imagery).
*   `docs/` - System architecture blueprints and Entity Relationship Diagrams (ERDs).
*   `developer_backup/` - Backups of Excel sheets, PDF maps, and developer scripts used during the data preparation phase. Kept separate to ensure a clean source code compilation.

---

## 🚀 Getting Started

### Prerequisites
1.  [Node.js](https://nodejs.org/) (v20+ recommended)
2.  MySQL Server (e.g., XAMPP, Laragon, or standalone MySQL on port `3306`)
3.  Firebase Project (Firestore enabled)

### Local Installation
1.  Clone this repository to your local machine:
    ```bash
    git clone https://github.com/Maine-Hub/ver2_ViaGraph.git
    cd ver2_ViaGraph
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables by creating a `.env` file in the root directory (refer to Firebase credential requirements and local MySQL connection details):
    ```env
    # Database Settings
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=
    DB_DATABASE=viagraph_experiment

    # Authentication Secrets
    JWT_SECRET=your_jwt_secret_key_here
    
    # Firebase Web Config Credentials
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
4.  Import the database schema:
    *   Locate the SQL dump file inside `developer_backup/viagraph_experiment.sql` and import it into your local MySQL server.
5.  Start the Next.js development server:
    ```bash
    npm run dev
    ```
6.  Open [http://localhost:9002](http://localhost:9002) in your browser to view the application.
