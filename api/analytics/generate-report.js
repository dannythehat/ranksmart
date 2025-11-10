/**
 * Generate Impact Report
 * Creates beautiful reports showing SEO improvements
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { userId, format = 'json', dateFrom, dateTo, reportType = 'custom' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Calculate date range
    const endDate = dateTo || new Date().toISOString().split('T')[0];
    const startDate = dateFrom || getDateDaysAgo(30);

    // Get all tracked articles for user
    const { data: articles, error: articlesError } = await supabase
      .from('article_tracking')
      .select('*')
      .eq('user_id', userId);

    if (articlesError) throw articlesError;

    // Get position history for date range
    const articleIds = articles.map(a => a.id);
    const { data: history, error: historyError } = await supabase
      .from('position_history')
      .select('*')
      .in('article_id', articleIds)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (historyError) throw historyError;

    // Generate report data
    const report = generateReportData(articles, history, startDate, endDate);

    // Save report to database
    await supabase
      .from('impact_reports')
      .insert({
        user_id: userId,
        report_type: reportType,
        date_from: startDate,
        date_to: endDate,
        total_articles: report.summary.totalArticles,
        articles_improved: report.summary.articlesImproved,
        articles_declined: report.summary.articlesDeclined,
        articles_stable: report.summary.articlesStable,
        avg_position_change: report.summary.avgPositionChange,
        total_traffic_increase: report.summary.totalTrafficIncrease,
        report_data: report
      })
      .onConflict('user_id,report_type,date_from,date_to')
      .merge();

    // Format response based on requested format
    if (format === 'html') {
      const html = generateHTMLReport(report);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    if (format === 'csv') {
      const csv = generateCSVReport(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ranksmart-impact-report-${endDate}.csv"`);
      return res.status(200).send(csv);
    }

    // Default: JSON
    return res.status(200).json({
      success: true,
      report,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });

  } catch (error) {
    console.error('Generate Report Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report'
    });
  }
};

/**
 * Generate report data from articles and history
 */
function generateReportData(articles, history, startDate, endDate) {
  // Calculate summary metrics
  const totalArticles = articles.length;
  const articlesImproved = articles.filter(a => a.status === 'improved').length;
  const articlesDeclined = articles.filter(a => a.status === 'declined').length;
  const articlesStable = articles.filter(a => a.status === 'stable').length;

  const avgPositionChange = articles.reduce((sum, a) => {
    return sum + (a.baseline_position - a.current_position);
  }, 0) / totalArticles || 0;

  const totalBaselineClicks = articles.reduce((sum, a) => sum + (a.baseline_clicks || 0), 0);
  const totalCurrentClicks = articles.reduce((sum, a) => sum + (a.current_clicks || 0), 0);
  const totalTrafficIncrease = totalCurrentClicks - totalBaselineClicks;

  // Top performers
  const topPerformers = articles
    .filter(a => a.baseline_position && a.current_position)
    .map(a => ({
      ...a,
      improvement: a.baseline_position - a.current_position
    }))
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 10);

  // Articles needing attention
  const needsAttention = articles
    .filter(a => a.status === 'declined')
    .map(a => ({
      ...a,
      decline: a.current_position - a.baseline_position
    }))
    .sort((a, b) => b.decline - a.decline)
    .slice(0, 10);

  // Daily trends
  const dailyTrends = {};
  history.forEach(h => {
    if (!dailyTrends[h.date]) {
      dailyTrends[h.date] = {
        date: h.date,
        avgPosition: [],
        totalClicks: 0,
        totalImpressions: 0
      };
    }
    dailyTrends[h.date].avgPosition.push(h.position);
    dailyTrends[h.date].totalClicks += h.clicks || 0;
    dailyTrends[h.date].totalImpressions += h.impressions || 0;
  });

  const trends = Object.values(dailyTrends).map(day => ({
    date: day.date,
    avgPosition: day.avgPosition.reduce((a, b) => a + b, 0) / day.avgPosition.length,
    totalClicks: day.totalClicks,
    totalImpressions: day.totalImpressions,
    ctr: day.totalImpressions > 0 ? (day.totalClicks / day.totalImpressions) * 100 : 0
  })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalArticles,
      articlesImproved,
      articlesDeclined,
      articlesStable,
      avgPositionChange: parseFloat(avgPositionChange.toFixed(2)),
      totalTrafficIncrease,
      improvementRate: totalArticles > 0 ? (articlesImproved / totalArticles * 100).toFixed(1) : 0
    },
    topPerformers,
    needsAttention,
    trends,
    dateRange: {
      start: startDate,
      end: endDate
    }
  };
}

/**
 * Generate HTML report
 */
function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>RankSmart Impact Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      border-radius: 15px;
      text-align: center;
      margin-bottom: 2rem;
    }
    .header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 2.5rem;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 0.5rem;
    }
    .stat-label {
      color: #6b7280;
      font-size: 0.9rem;
    }
    .section {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    .section h2 {
      margin-top: 0;
      color: #1f2937;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .positive {
      color: #10b981;
      font-weight: 600;
    }
    .negative {
      color: #ef4444;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body {
        background: white;
      }
      .header {
        background: #667eea;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📈 RankSmart Impact Report</h1>
    <p>${report.dateRange.start} to ${report.dateRange.end}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${report.summary.totalArticles}</div>
      <div class="stat-label">Total Articles Tracked</div>
    </div>
    <div class="stat-card">
      <div class="stat-value positive">${report.summary.articlesImproved}</div>
      <div class="stat-label">Articles Improved</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.summary.avgPositionChange > 0 ? '+' : ''}${report.summary.avgPositionChange}</div>
      <div class="stat-label">Avg Position Change</div>
    </div>
    <div class="stat-card">
      <div class="stat-value positive">+${report.summary.totalTrafficIncrease}</div>
      <div class="stat-label">Traffic Increase (clicks)</div>
    </div>
  </div>

  <div class="section">
    <h2>🏆 Top Performers</h2>
    <table>
      <thead>
        <tr>
          <th>Article</th>
          <th>Keyword</th>
          <th>Before</th>
          <th>After</th>
          <th>Improvement</th>
        </tr>
      </thead>
      <tbody>
        ${report.topPerformers.map(article => `
          <tr>
            <td>${article.title || article.url}</td>
            <td>${article.target_keyword}</td>
            <td>${article.baseline_position}</td>
            <td>${article.current_position}</td>
            <td class="positive">+${article.improvement} positions</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${report.needsAttention.length > 0 ? `
  <div class="section">
    <h2>⚠️ Needs Attention</h2>
    <table>
      <thead>
        <tr>
          <th>Article</th>
          <th>Keyword</th>
          <th>Before</th>
          <th>After</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        ${report.needsAttention.map(article => `
          <tr>
            <td>${article.title || article.url}</td>
            <td>${article.target_keyword}</td>
            <td>${article.baseline_position}</td>
            <td>${article.current_position}</td>
            <td class="negative">-${article.decline} positions</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by <strong>RankSmart</strong> - The World's Best AI SEO Tool</p>
    <p>https://ranksmart.io</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate CSV report
 */
function generateCSVReport(report) {
  const rows = [
    ['RankSmart Impact Report'],
    [`Date Range: ${report.dateRange.start} to ${report.dateRange.end}`],
    [],
    ['Summary'],
    ['Total Articles', report.summary.totalArticles],
    ['Articles Improved', report.summary.articlesImproved],
    ['Articles Declined', report.summary.articlesDeclined],
    ['Articles Stable', report.summary.articlesStable],
    ['Avg Position Change', report.summary.avgPositionChange],
    ['Total Traffic Increase', report.summary.totalTrafficIncrease],
    [],
    ['Top Performers'],
    ['Title', 'URL', 'Keyword', 'Baseline Position', 'Current Position', 'Improvement'],
    ...report.topPerformers.map(a => [
      a.title || '',
      a.url,
      a.target_keyword,
      a.baseline_position,
      a.current_position,
      a.improvement
    ])
  ];

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Get date N days ago
 */
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
