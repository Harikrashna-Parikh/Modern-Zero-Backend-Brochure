# 🛍️ AURA | Modern Zero-Backend Brochure CMS

A stunning, responsive, and completely backend-free brochure website designed to showcase products, manage catalogs, and generate leads directly via WhatsApp or Email. It can be hosted 100% free on **GitHub Pages**.

This brochure comes with a built-in **client-side Admin Panel** that lets you add/remove sections, upload and compress photos, update prices/specifications, and customize company branding details directly from the browser. You don't need a database, an API, or any paid hosting.

---

## ✨ Key Features

*   ** Obsidian Dark & Light Mode:** Sleek, high-contrast, modern UI built with premium glassmorphism accents and smooth micro-animations.
*   **Built-in Admin Panel:** Lock/Unlock the editor directly in the browser. Click **"Edit Site"** to edit sections, products, and brand branding.
*   **Smart Image Resizer & Compressor:** A custom canvas engine that resizes and compresses user-uploaded images to lightweight, high-performance base64 JPEG strings, saving storage and ensuring instant page loads.
*   **Multi-Photo Slider/Carousel:** Support for adding multiple images per product.
*   **Dynamic Specs & Features Builders:** Add/edit/remove key highlight bullet points and tabular specifications dynamically inside the admin form.
*   **Lead Generation Engine:** Dynamic "Inquire on WhatsApp" and "Send Email Inquiry" buttons that automatically open the user's apps with pre-filled messages mentioning the product name, details, and price.
*   **Configurable Settings:** Edit Company Name, Tagline, Hero headers, WhatsApp contact, and Email on the fly.
*   **Zero Database Setup:** All changes are synced to your browser's local storage and can be exported as a single `data.json` database file to update the live repo.

---

## 🚀 How to Run Locally

You do not need to install node or any compilers. It is built with vanilla HTML, CSS, and JS!

### Option A: Double-Click (Easiest)
1.  Navigate to the project directory.
2.  Double-click `index.html` to open it in your browser.
    *   *Note: In some browsers, fetching local JSON files (`data.json`) directly via file protocol (`file:///`) might trigger browser CORS security warnings. If you see a loading spinner indefinitely, use Option B.*

### Option B: Local Web Server (Recommended)
Running via a local server provides the best experience and behaves exactly like a production environment.

**If you have VS Code:**
*   Install the **Live Server** extension, open the project folder, and click **Go Live**.

**If you have Python installed:**
*   Open your terminal in the project directory and run:
    ```bash
    python3 -m http.server 8000
    ```
*   Open your browser and go to `http://localhost:8000`.

---

## 🛠️ How to Edit & Customize Your Site (The CMS Workflow)

Since there is no backend, here is the extremely simple, 3-step workflow to update your website:

1.  **Customize in Browser:**
    *   Open your site.
    *   Click the **"Edit Site"** button in the top right corner.
    *   Customize your hero texts, edit company settings, create new sections, or upload/delete products. All of this is saved instantly in your browser's memory (`localStorage`).
2.  **Export Changes:**
    *   Once you are happy with the updates, click the **"Save & Export Config"** button on the top admin banner (or the floating gear menu on the bottom right).
    *   Click **"Download data.json"** to get the updated database file.
3.  **Deploy Live:**
    *   Copy your downloaded `data.json` and replace the existing `data.json` file in your repository.
    *   Commit and push to GitHub, and your live website updates automatically!

---

## 🌐 Deploy to GitHub Pages (100% Free Hosting)

Follow these steps to host your website on GitHub for free:

1.  **Create a Repository:**
    *   Go to [GitHub](https://github.com) and create a new public repository (e.g., `aura-brochure`).
2.  **Upload Files:**
    *   Upload all the files in this directory to your new repository. Your repository file structure should look like this:
        ```text
        ├── assets/
        │   └── images/
        │       ├── chair.png
        │       ├── headphones.png
        │       └── watch.png
        ├── app.js
        ├── data.json
        ├── index.html
        ├── README.md
        └── style.css
        ```
3.  **Enable GitHub Pages:**
    *   In your GitHub repository, click on **Settings** (top tab bar).
    *   On the left sidebar, click on **Pages**.
    *   Under **Build and deployment**, set the **Source** to **Deploy from a branch**.
    *   Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
    *   Click **Save**.
4.  **Go Live:**
    *   Within 1–2 minutes, GitHub will generate a link for you, usually in the format: `https://yourusername.github.io/aura-brochure/`.
    *   Open the link to view your live, premium brochure!

---

## 📁 File Structure

*   `index.html`: Holds the structure of the site, including search bars, dynamic containers, modals, and edit forms.
*   `style.css`: Modern styling sheet using CSS variables for theme toggle, animations, responsive grid system, and glassmorphism.
*   `app.js`: Application logic handles theme toggle, dynamic rendering, local storage sync, JSON import/export, canvas image compressor, and search.
*   `data.json`: The main database holding all your products, specs, features, and site settings.
*   `assets/images/`: Stores default high-quality product images.

---

## 📝 Configuration Schema (`data.json`)
If you want to edit your website configuration manually, the `data.json` file follows this structure:

```json
{
  "settings": {
    "companyName": "Brand Name",
    "companyTagline": "Slogan",
    "heroTitle": "Main Title on Page",
    "heroSubtitle": "Subtitle text below title",
    "whatsappNumber": "Country code + number (no spaces/symbols)",
    "emailAddress": "inquiry email",
    "currency": "$"
  },
  "sections": [
    {
      "id": "sec-category-id",
      "title": "Category Title",
      "description": "Short category description",
      "products": [
        {
          "id": "prod-unique-id",
          "name": "Product Name",
          "tagline": "Short tagline",
          "description": "Long detailed description...",
          "price": "299.00",
          "images": [
            "imageurl_or_base64_or_localpath"
          ],
          "features": [
            "Feature Bullet 1",
            "Feature Bullet 2"
          ],
          "specs": [
            { "label": "Key", "value": "Value" }
          ]
        }
      ]
    }
  ]
}
```
