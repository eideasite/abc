<script setup>
import { ExternalLink, FileText, Linkedin, Mail, Phone } from 'lucide-vue-next'

const effectiveDate = '2026-11-18'
</script>

<template>
  <article class="page-wrap narrow-page privacy-policy-page">
    <header class="page-heading privacy-policy-heading">
      <span class="eyebrow">Privacy and data</span>
      <h1>
        Privacy Policy
        <FileText
          :size="25"
          aria-hidden="true"
        />
      </h1>
    </header>

    <section
      class="surface-card privacy-policy-contact"
      aria-label="Policy owner and contact details"
    >
      <p>Effective Date: <time :datetime="effectiveDate">11/18/2026</time></p>
      <p>Maintained by: <strong>Jeyamohan Manoharan</strong></p>
      <p>
        Email:
        <a href="mailto:career.jm@gmail.com">
          <Mail
            :size="15"
            aria-hidden="true"
          /> career.jm@gmail.com
        </a>
      </p>
      <p>
        Mobile:
        <a href="tel:+94754977449">
          <Phone
            :size="15"
            aria-hidden="true"
          /> +94 754 977 449
        </a>
      </p>
      <p>
        LinkedIn:
        <a
          href="https://www.linkedin.com/in/career4jm"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Linkedin
            :size="15"
            aria-hidden="true"
          /> linkedin.com/in/career4jm
          <ExternalLink
            :size="13"
            aria-hidden="true"
          />
        </a>
      </p>
    </section>

    <div class="privacy-policy-content">
      <section>
        <h2>Information stored in this browser</h2>
        <p>
          Articles, drafts, posts, images, highlights, bookmarks, and preferences are stored locally in this browser using its storage facilities. This app has no server account or cloud sync. The browser may remove local data if site data is cleared or the device is reset; download a backup to keep a separate copy.
        </p>
      </section>
      <section>
        <h2>Search and external AI services</h2>
        <p>
          When you submit a query with Google AI Search, the query is sent to Google Search AI Mode. When you choose an external AI provider, the prompt you submit is sent to that provider. Google, OpenAI, and Meta handle those requests under their own privacy terms. Avoid sending information you do not want those services to receive.
        </p>
      </section>
      <section>
        <h2>Backups and network checks</h2>
        <p>
          Backup files are created and downloaded on your device; this app does not upload them. The optional connection speed test downloads a public sample to measure network speed and does not include article or post content.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          For questions about this policy or the app, contact
          <a href="mailto:career.jm@gmail.com">career.jm@gmail.com</a>.
        </p>
      </section>
    </div>
  </article>
</template>
