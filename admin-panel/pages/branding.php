<?php
$pageTitle = 'Branding & Landing Page';

$siteTitle      = getSetting($db, 'site_title', 'NUMID — Who Saved Me?');
$metaDesc       = getSetting($db, 'meta_description', 'Discover who has your phone number saved in their contacts. NUMID lets you search any number and find out — privately and securely.');
$metaKeywords   = getSetting($db, 'meta_keywords', 'who saved my number, phone number lookup, contact search, NUMID');
$ogTitle        = getSetting($db, 'og_title', 'NUMID — Who Saved Me?');
$ogDesc         = getSetting($db, 'og_description', 'Discover who has your phone number saved in their contacts.');
$appName        = getSetting($db, 'app_name', 'NUMID');
$heroTitle      = getSetting($db, 'hero_title', 'Find out <span class="accent">who saved</span> your number');
$heroSubtitle   = getSetting($db, 'hero_subtitle', 'NUMID lets you search any phone number and instantly see who has it saved in their contacts — privately, securely, in seconds.');
$iosUrl         = getSetting($db, 'ios_app_url', '#');
$androidUrl     = getSetting($db, 'android_app_url', '#');
$downloadNote   = getSetting($db, 'download_note', 'Coming soon to both stores · Currently in beta');
$footerEmail    = getSetting($db, 'footer_email', 'hamzamassaoui@gmail.com');
$footerCopy     = getSetting($db, 'footer_copyright', '© 2025 NUMID · Who Saved Me. All rights reserved.');
$footerTagline  = getSetting($db, 'footer_tagline', 'Discover who has your phone number saved in their contacts. Fast, private, and available in English, Arabic, and French.');
$hasLogo        = (bool) getSetting($db, 'landing_logo_base64', '');
$hasFavicon     = (bool) getSetting($db, 'landing_favicon_base64', '');

ob_start();
?>

<style>
  .branding-section { background: #0F1623; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
  .branding-section h2 { font-size: 13px; font-weight: 600; color: white; margin-bottom: 4px; }
  .branding-section p.desc { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
  .field-label { display: block; font-size: 11px; color: #6b7280; margin-bottom: 6px; }
  .field-input { width: 100%; background: #080C14; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 12px; font-size: 13px; color: white; outline: none; }
  .field-input:focus { border-color: rgba(0,201,212,0.4); }
  .field-textarea { resize: vertical; min-height: 72px; }
  .save-btn { margin-top: 12px; background: rgba(0,201,212,0.1); color: #00C9D4; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .save-btn:hover { background: rgba(0,201,212,0.2); }
  .upload-label { display: block; border: 1.5px dashed rgba(255,255,255,0.12); border-radius: 10px; padding: 20px; text-align: center; cursor: pointer; transition: border-color 0.15s; }
  .upload-label:hover { border-color: rgba(0,201,212,0.4); }
  .upload-label .preview { height: 56px; object-fit: contain; margin: 0 auto 8px; display: block; }
  .badge-active { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; background: rgba(34,197,94,0.1); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); margin-left: 8px; }
  .badge-empty  { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.05); color: #6b7280; border: 1px solid rgba(255,255,255,0.08); margin-left: 8px; }
  .remove-btn { margin-top: 8px; display: block; width: 100%; background: rgba(239,68,68,0.08); color: #ef4444; border: none; border-radius: 8px; padding: 8px 14px; font-size: 12px; cursor: pointer; transition: background 0.15s; }
  .remove-btn:hover { background: rgba(239,68,68,0.16); }
</style>

<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px;">

  <!-- LEFT COLUMN -->
  <div>

    <!-- App Identity -->
    <div class="branding-section">
      <h2>App Identity</h2>
      <p class="desc">App name used in the landing page and metadata.</p>
      <form method="POST" action="/admin/branding">
        <input type="hidden" name="action" value="save_identity">
        <div style="margin-bottom:12px;">
          <label class="field-label">App Name</label>
          <input type="text" name="app_name" value="<?= htmlspecialchars($appName) ?>" class="field-input" placeholder="NUMID">
        </div>
        <button type="submit" class="save-btn">Save Identity</button>
      </form>
    </div>

    <!-- Landing Page Logo -->
    <div class="branding-section">
      <h2>Landing Page Logo <span class="<?= $hasLogo ? 'badge-active' : 'badge-empty' ?>"><?= $hasLogo ? 'Custom' : 'Default' ?></span></h2>
      <p class="desc">Shown in the top nav and footer of the landing page. Recommended: transparent PNG, 200×60px.</p>
      <form method="POST" action="/admin/branding" enctype="multipart/form-data" id="logo-form">
        <input type="hidden" name="action" value="upload_logo">
        <label class="upload-label" for="logo-file">
          <input type="file" id="logo-file" name="logo_file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none" onchange="this.form.submit()">
          <?php if ($hasLogo): ?>
            <img src="/api/assets/logo?v=<?= time() ?>" class="preview" alt="Current logo" />
            <div style="font-size:12px; color:#6b7280;">Click to replace</div>
          <?php else: ?>
            <div style="font-size: 28px; margin-bottom: 8px; color:#4A5568;">🖼</div>
            <div style="font-size: 13px; color: #8B95A8; margin-bottom: 4px;">Click to upload logo</div>
            <div style="font-size: 11px; color: #4A5568;">PNG, JPG, SVG, WebP · Max 2MB</div>
          <?php endif; ?>
        </label>
      </form>
      <?php if ($hasLogo): ?>
        <form method="POST" action="/admin/branding">
          <input type="hidden" name="action" value="remove_logo">
          <button type="submit" class="remove-btn" onclick="return confirm('Remove custom logo? The default logo file will be used.')">Remove custom logo</button>
        </form>
      <?php endif; ?>
    </div>

    <!-- Favicon -->
    <div class="branding-section">
      <h2>Favicon <span class="<?= $hasFavicon ? 'badge-active' : 'badge-empty' ?>"><?= $hasFavicon ? 'Custom' : 'Default' ?></span></h2>
      <p class="desc">The small icon shown in browser tabs. Recommended: 32×32 or 64×64 PNG.</p>
      <form method="POST" action="/admin/branding" enctype="multipart/form-data">
        <input type="hidden" name="action" value="upload_favicon">
        <label class="upload-label" for="favicon-file">
          <input type="file" id="favicon-file" name="favicon_file" accept="image/png,image/x-icon,image/jpeg,image/svg+xml" style="display:none" onchange="this.form.submit()">
          <?php if ($hasFavicon): ?>
            <img src="/api/assets/favicon?v=<?= time() ?>" class="preview" alt="Current favicon" style="height:32px;" />
            <div style="font-size:12px; color:#6b7280;">Click to replace</div>
          <?php else: ?>
            <div style="font-size: 28px; margin-bottom: 8px; color:#4A5568;">🔲</div>
            <div style="font-size: 13px; color: #8B95A8; margin-bottom: 4px;">Click to upload favicon</div>
            <div style="font-size: 11px; color: #4A5568;">PNG, ICO, SVG · Recommended 32×32</div>
          <?php endif; ?>
        </label>
      </form>
      <?php if ($hasFavicon): ?>
        <form method="POST" action="/admin/branding">
          <input type="hidden" name="action" value="remove_favicon">
          <button type="submit" class="remove-btn" onclick="return confirm('Remove custom favicon?')">Remove custom favicon</button>
        </form>
      <?php endif; ?>
    </div>

    <!-- Hero Section -->
    <div class="branding-section">
      <h2>Hero Section</h2>
      <p class="desc">The main headline and subtitle shown at the top of the landing page. HTML is allowed in the title — use <code style="font-size:11px; color:#00C9D4;">&lt;span class="accent"&gt;text&lt;/span&gt;</code> for teal-colored words.</p>
      <form method="POST" action="/admin/branding">
        <input type="hidden" name="action" value="save_hero">
        <div style="margin-bottom:12px;">
          <label class="field-label">Hero Title (HTML allowed)</label>
          <input type="text" name="hero_title" value="<?= htmlspecialchars($heroTitle) ?>" class="field-input">
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">Hero Subtitle</label>
          <textarea name="hero_subtitle" class="field-input field-textarea"><?= htmlspecialchars($heroSubtitle) ?></textarea>
        </div>
        <button type="submit" class="save-btn">Save Hero</button>
      </form>
    </div>

  </div>

  <!-- RIGHT COLUMN -->
  <div>

    <!-- SEO / Metadata -->
    <div class="branding-section">
      <h2>SEO &amp; Metadata</h2>
      <p class="desc">Controls the browser tab title, search engine snippets, and social media previews.</p>
      <form method="POST" action="/admin/branding">
        <input type="hidden" name="action" value="save_seo">
        <div style="margin-bottom:12px;">
          <label class="field-label">Page Title (browser tab)</label>
          <input type="text" name="site_title" value="<?= htmlspecialchars($siteTitle) ?>" class="field-input" placeholder="NUMID — Who Saved Me?">
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">Meta Description</label>
          <textarea name="meta_description" class="field-input field-textarea" placeholder="Short description for search engines..."><?= htmlspecialchars($metaDesc) ?></textarea>
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">Keywords (comma-separated)</label>
          <input type="text" name="meta_keywords" value="<?= htmlspecialchars($metaKeywords) ?>" class="field-input" placeholder="who saved me, phone lookup...">
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">OG Title (social share preview)</label>
          <input type="text" name="og_title" value="<?= htmlspecialchars($ogTitle) ?>" class="field-input">
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">OG Description (social share preview)</label>
          <textarea name="og_description" class="field-input field-textarea"><?= htmlspecialchars($ogDesc) ?></textarea>
        </div>
        <button type="submit" class="save-btn">Save SEO Settings</button>
      </form>
    </div>

    <!-- App Store Links -->
    <div class="branding-section">
      <h2>App Store Links</h2>
      <p class="desc">URLs for the iOS App Store and Google Play buttons on the download section.</p>
      <form method="POST" action="/admin/branding">
        <input type="hidden" name="action" value="save_store_links">
        <div style="margin-bottom:12px;">
          <label class="field-label">iOS App Store URL</label>
          <input type="url" name="ios_app_url" value="<?= htmlspecialchars($iosUrl) ?>" class="field-input" placeholder="https://apps.apple.com/...">
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">Google Play URL</label>
          <input type="url" name="android_app_url" value="<?= htmlspecialchars($androidUrl) ?>" class="field-input" placeholder="https://play.google.com/...">
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">Download Note (below store buttons)</label>
          <input type="text" name="download_note" value="<?= htmlspecialchars($downloadNote) ?>" class="field-input" placeholder="Coming soon to both stores · Currently in beta">
        </div>
        <button type="submit" class="save-btn">Save Store Links</button>
      </form>
    </div>

    <!-- Footer / Credits -->
    <div class="branding-section">
      <h2>Footer &amp; Credits</h2>
      <p class="desc">Footer content including contact email, tagline, and copyright text.</p>
      <form method="POST" action="/admin/branding">
        <input type="hidden" name="action" value="save_footer">
        <div style="margin-bottom:12px;">
          <label class="field-label">Contact Email</label>
          <input type="email" name="footer_email" value="<?= htmlspecialchars($footerEmail) ?>" class="field-input" placeholder="contact@example.com">
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">Brand Tagline (footer description)</label>
          <textarea name="footer_tagline" class="field-input field-textarea"><?= htmlspecialchars($footerTagline) ?></textarea>
        </div>
        <div style="margin-bottom:12px;">
          <label class="field-label">Copyright Text</label>
          <input type="text" name="footer_copyright" value="<?= htmlspecialchars($footerCopy) ?>" class="field-input" placeholder="© 2025 NUMID. All rights reserved.">
        </div>
        <button type="submit" class="save-btn">Save Footer</button>
      </form>
    </div>

    <!-- Preview Link -->
    <div class="branding-section" style="text-align:center;">
      <h2 style="margin-bottom:8px;">Preview Landing Page</h2>
      <p class="desc">Changes take effect immediately on the live landing page.</p>
      <a href="/" target="_blank" style="display:inline-flex; align-items:center; gap:8px; background:rgba(0,201,212,0.1); color:#00C9D4; border-radius:10px; padding:10px 20px; font-size:13px; font-weight:500; text-decoration:none; transition:background 0.15s;"
         onmouseover="this.style.background='rgba(0,201,212,0.2)'" onmouseout="this.style.background='rgba(0,201,212,0.1)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Open Landing Page
      </a>
    </div>

  </div>
</div>

<?php
$content = ob_get_clean();
include __DIR__ . '/../layout.php';
