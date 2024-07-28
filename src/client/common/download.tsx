export default function download (content: string, filename: string): void {
  // Create a blob with the content, specifying the MIME type as application/json
  const blob = new Blob([content], { type: 'application/json' })

  // Create a link element
  const link = document.createElement('a')

  // Create an object URL for the blob
  const url = URL.createObjectURL(blob)

  // Set the download attribute with the filename
  link.href = url
  link.download = filename

  // Append the link to the document body (required for some browsers)
  document.body.appendChild(link)

  // Programmatically click the link to trigger the download
  link.click()

  // Remove the link from the document
  document.body.removeChild(link)

  // Release the object URL
  URL.revokeObjectURL(url)
}
