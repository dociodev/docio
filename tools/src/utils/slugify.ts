export function slugify(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2') // Insert hyphen between camelCase
    .toLowerCase()
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/[\/:]/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/^[^a-z]+/, '');
}
