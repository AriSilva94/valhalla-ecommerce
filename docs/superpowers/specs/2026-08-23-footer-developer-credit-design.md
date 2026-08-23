# Footer Developer Credit Design

## Context

Valhalla Tecnologia already has a structured footer with four content columns and a separated legal row. The new developer credit must be a reusable, discreet footer pattern for this and future sites created by AriSilva.tech.

## Selected Direction

Use a split legal row:

- Left side: existing legal text from `settings.footerLegalText`.
- Right side: developer credit link.

The credit text is:

`Desenvolvido por AriSilva.tech`

The full credit, including icon and text, links to:

`https://arisilva.tech/pt-br`

The link opens in a new tab and uses safe external-link attributes.

## Visual Treatment

The credit should be visually secondary:

- Use the same muted footer color family already used by the legal row.
- Keep the font size aligned with the current legal text scale.
- Use a professional library icon, not a handmade text glyph.
- Use the `Code2` icon to signal software development and programming.
- Place the icon before the text with a small gap.
- Avoid promotional styling, badges, bright accents, or button treatment.

The desktop layout keeps the legal text on the left and the developer credit on the right. On smaller screens, the row may wrap naturally, with both items remaining readable and non-overlapping.

## Component Boundary

The change belongs in `app/components/Footer.tsx`.

The credit is fixed site chrome, not CMS-managed editorial content. It should not be added to Strapi settings or footer link columns.

## Accessibility And Behavior

- The link text must be readable without relying on the icon.
- The decorative icon should be hidden from assistive technology.
- The external link should include `target="_blank"` and `rel="noopener noreferrer"`.
- The layout must remain stable when `settings.footerLegalText` is empty or long.

## Out Of Scope

- Changing footer columns, CMS fields, or legal text semantics.
- Adding analytics tracking for the credit link.
- Creating a reusable package for other sites in this task.
- Redesigning the footer.
