/**
 * Process HTML content to wrap images with captions in figure elements
 * and render captions as figcaption
 */
export function processImagesWithCaptions(html: string): string {
  if (!html) return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Find all images (with or without caption)
  const images = doc.querySelectorAll("img");

  images.forEach((img) => {
    const caption = img.getAttribute("data-caption");
    const align = img.getAttribute("data-align") || "center";

    // Only wrap in figure if there's a caption
    if (caption && caption.trim() !== "") {
      // Create figure element
      const figure = doc.createElement("figure");
      figure.className = "image-figure";
      figure.setAttribute("data-align", align);

      // Clone the image
      const newImg = img.cloneNode(true) as HTMLImageElement;
      newImg.removeAttribute("data-caption");
      newImg.removeAttribute("data-align");

      // Create figcaption
      const figcaption = doc.createElement("figcaption");
      figcaption.textContent = caption;

      // Assemble figure
      figure.appendChild(newImg);
      figure.appendChild(figcaption);

      // Replace original image with figure
      img.parentNode?.replaceChild(figure, img);
    } else if (align !== "center") {
      // If no caption but has alignment, wrap in div for alignment
      const wrapper = doc.createElement("div");
      wrapper.className = "image-wrapper-align";
      wrapper.setAttribute("data-align", align);
      wrapper.style.textAlign = align;

      const newImg = img.cloneNode(true) as HTMLImageElement;
      newImg.removeAttribute("data-align");

      wrapper.appendChild(newImg);
      img.parentNode?.replaceChild(wrapper, img);
    }
  });

  return doc.body.innerHTML;
}
