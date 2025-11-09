# Dashboard Update Instructions

## Add Auto-Update Link to Sidebar

In `public/dashboard.html`, add the following link after the "Fix My Article" link (around line 38):

```html
<a href="auto-update.html" class="sidebar-link">
    <span class="icon">🔄</span>
    <span>Auto-Update</span>
</a>
```

### Complete Sidebar Navigation (lines 18-50):

```html
<nav class="sidebar-nav">
    <a href="dashboard.html" class="sidebar-link active">
        <span class="icon">📊</span>
        <span>Dashboard</span>
    </a>
    <a href="audit.html" class="sidebar-link">
        <span class="icon">🔍</span>
        <span>New Audit</span>
    </a>
    <a href="serp-analysis.html" class="sidebar-link">
        <span class="icon">🎯</span>
        <span>SERP Analysis</span>
    </a>
    <a href="competitor-mode.html" class="sidebar-link">
        <span class="icon">✨</span>
        <span>Content Generator</span>
    </a>
    <a href="optimize.html" class="sidebar-link">
        <span class="icon">🛠️</span>
        <span>Fix My Article</span>
    </a>
    <a href="auto-update.html" class="sidebar-link">
        <span class="icon">🔄</span>
        <span>Auto-Update</span>
    </a>
    <a href="#" class="sidebar-link">
        <span class="icon">📁</span>
        <span>My Projects</span>
    </a>
    <a href="#" class="sidebar-link">
        <span class="icon">📈</span>
        <span>Analytics</span>
    </a>
    <a href="settings.html" class="sidebar-link">
        <span class="icon">⚙️</span>
        <span>Settings</span>
    </a>
</nav>
```

## Add Quick Action Card

In the Quick Actions section (around line 150), add:

```html
<div class="action-card">
    <div class="action-icon">🔄</div>
    <h3>Auto-Update Monitor</h3>
    <p>Track content changes and keep articles up-to-date automatically</p>
    <a href="auto-update.html" class="btn btn-primary">Monitor Content</a>
</div>
```

This should be added after the "Fix My Article" action card.
