Muhammad Shayan: portfolio website
=====================================

Open index.html in any browser to view the site. Everything works offline except the web fonts.

Pages
  index.html                Home: hero, about + numbers, featured case study, credentials,
                            six case studies (with filters), experience, services, contact
  resume.html               Printable resume ("Print or save as PDF" button)
  case-studies/*.html       One page per case study: problem / solution / result, steps,
                            results, executive summary, the one-page summary (click to enlarge)
                            and the full report embedded, with downloads

Files
  assets/pdf/case-0X-full-report.pdf   full implementation reports (33-44 pages)
  assets/pdf/case-0X-one-page.pdf      one-page summaries
  assets/img/                          case card screens and one-page summary images

Publishing
  Upload the whole folder to any static host (Netlify Drop, GitHub Pages, Vercel, cPanel).

Editing
  The text lives in ../shayan-portfolio-build/data.mjs. Change it, then run:
      node gen.mjs        (inside shayan-portfolio-build)
  The LinkedIn address is LINKEDIN_URL at the top of data.mjs.
