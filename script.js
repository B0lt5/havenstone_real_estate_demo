// Havenstone Realty demo interactions — plain beginner-friendly JavaScript.
const menuToggle = document.querySelector("#menuToggle");
const mainNav = document.querySelector("#mainNav");

function createIcon(className) {
  const icon = document.createElement("i");
  icon.className = className;
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function setMenuIcon(isOpen) {
  menuToggle.replaceChildren(createIcon(isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars"));
}

const demoBanner = document.querySelector("#demoBanner");
const demoBannerDismiss = document.querySelector("#demoBannerDismiss");
const demoBannerDismissedKey = "havenstone-demo-banner-dismissed";

try {
  demoBanner.hidden = sessionStorage.getItem(demoBannerDismissedKey) === "true";
} catch (error) {
  console.warn("Could not read the demo notice session state:", error);
}

demoBannerDismiss.addEventListener("click", () => {
  demoBanner.hidden = true;
  try {
    sessionStorage.setItem(demoBannerDismissedKey, "true");
  } catch (error) {
    console.warn("Could not save the demo notice session state:", error);
  }
});

setMenuIcon(false);
menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", isOpen);
  setMenuIcon(isOpen);
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

mainNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    setMenuIcon(false);
    menuToggle.setAttribute("aria-label", "Open navigation");
  });
});

const propertyGrid = document.querySelector("#propertyGrid");
const searchForm = document.querySelector("#searchForm");
const purposeSelect = document.querySelector("#purpose");
const typeSelect = document.querySelector("#propertyType");
const locationSelect = document.querySelector("#location");
const resultsLabel = document.querySelector("#resultsLabel");
const emptyState = document.querySelector("#emptyState");
const propertyDialog = document.querySelector("#propertyDialog");
const dialogImage = document.querySelector("#dialogImage");
const dialogThumbnails = document.querySelector("#dialogThumbnails");
const toast = document.querySelector("#toast");
let propertyCards = [];
let propertiesById = new Map();
let activeProperty = null;
let purposeFilter = "all";
let toastTimer;

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatQuantity(value, singular, plural) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return "";
  return `${quantity} ${quantity === 1 ? singular : plural}`;
}

function getPropertyImages(property) {
  const primaryImage = property["primary-image"] || property.image;
  const otherImages = Array.isArray(property["other-images"]) ? property["other-images"] : [];
  return [primaryImage, ...otherImages].filter(image => typeof image === "string" && image.length > 0);
}

function createPropertyCard(property) {
  const card = createElement("article", "property-card");
  card.dataset.id = property.id;
  card.dataset.purpose = property.purpose;
  card.dataset.type = property.type;
  card.dataset.location = property.location;

  const imageContainer = createElement("div", "property-image");
  const image = createElement("img");
  image.src = getPropertyImages(property)[0] || "";
  image.alt = `Sample property image for ${property.displayLocation}`;
  image.loading = "lazy";
  imageContainer.append(image);

  const statusTag = createElement(
    "span",
    property.purpose === "Rent" ? "status-tag rent-tag" : "status-tag",
    property.purpose === "Rent" ? "FOR RENT" : "FOR SALE"
  );
  imageContainer.append(statusTag);

  const saveButton = createElement("button", "save-button");
  saveButton.type = "button";
  saveButton.append(createIcon("fa-regular fa-heart"));
  saveButton.setAttribute("aria-label", "Save property to favourites");
  saveButton.setAttribute("aria-pressed", "false");
  saveButton.title = "Save property";
  imageContainer.append(saveButton);
  card.append(imageContainer);

  const body = createElement("div", "property-body");
  const propertyLocation = createElement("div", "property-location");
  propertyLocation.append(
    createIcon("fa-solid fa-location-dot"),
    document.createTextNode(` ${property.displayLocation.toUpperCase()}`)
  );
  body.append(propertyLocation);
  body.append(createElement("h3", "", property.title));
  body.append(createElement("p", "property-desc", property.description));

  const specs = createElement("div", "property-specs");
  if (property.type) {
    const typeSpec = createElement("span");
    typeSpec.append(createIcon("fa-solid fa-house"), document.createTextNode(` ${property.type}`));
    specs.append(typeSpec);
  }
  const bedroomLabel = property.bedrooms == null
    ? ""
    : formatQuantity(property.bedrooms, "Bedroom", "Bedrooms");
  if (bedroomLabel) {
    const bedroomSpec = createElement("span");
    bedroomSpec.append(createIcon("fa-solid fa-bed"), document.createTextNode(` ${bedroomLabel}`));
    specs.append(bedroomSpec);
  }
  if (specs.childElementCount > 0) body.append(specs);

  const bottom = createElement("div", "property-bottom");
  const price = createElement("strong", "", `₦${new Intl.NumberFormat("en-NG").format(property.price)}`);
  if (property.pricePeriod) {
    price.append(createElement("small", "", ` / ${property.pricePeriod}`));
  }
  bottom.append(price);

  const detailsButton = createElement("button", "details-button");
  detailsButton.type = "button";
  detailsButton.dataset.propertyId = property.id;
  detailsButton.append(document.createTextNode("View details "), createIcon("fa-solid fa-arrow-up-right-from-square"));
  bottom.append(detailsButton);
  body.append(bottom);
  card.append(body);
  return card;
}

function openPropertyDialog(property) {
  activeProperty = property;
  const images = getPropertyImages(property);
  dialogImage.src = images[0] || "";
  dialogImage.alt = `${property.title} in ${property.displayLocation}`;

  dialogThumbnails.replaceChildren();
  dialogThumbnails.hidden = images.length < 2;
  images.forEach((imagePath, index) => {
    const thumbnail = createElement("button", "property-dialog-thumbnail");
    thumbnail.type = "button";
    thumbnail.setAttribute("aria-label", `Show property photo ${index + 1}`);
    thumbnail.setAttribute("aria-pressed", index === 0);
    const thumbnailImage = createElement("img");
    thumbnailImage.src = imagePath;
    thumbnailImage.alt = "";
    thumbnailImage.loading = "lazy";
    thumbnail.append(thumbnailImage);
    dialogThumbnails.append(thumbnail);
  });

  const status = document.querySelector("#dialogStatus");
  status.textContent = property.purpose === "Rent" ? "FOR RENT" : "FOR SALE";
  status.classList.toggle("rent-tag", property.purpose === "Rent");
  document.querySelector("#dialogLocation").textContent = property.displayLocation;
  document.querySelector("#dialogPropertyTitle").textContent = property.title;
  const price = `₦${new Intl.NumberFormat("en-NG").format(property.price)}`;
  document.querySelector("#dialogPrice").textContent =
    property.pricePeriod ? `${price} / ${property.pricePeriod}` : price;
  document.querySelector("#dialogDescription").textContent = property.description;

  const specs = document.querySelector("#dialogSpecs");
  specs.replaceChildren();
  const parkingLabel = Number(property.parking) === 0
    ? "No dedicated parking"
    : formatQuantity(property.parking, "parking space", "parking spaces");
  [
    ["fa-solid fa-house", property.type],
    ["fa-solid fa-bed", property.bedrooms == null ? "" : formatQuantity(property.bedrooms, "Bedroom", "Bedrooms")],
    ["fa-solid fa-bath", property.bathrooms == null ? "" : formatQuantity(property.bathrooms, "Bathroom", "Bathrooms")],
    ["fa-solid fa-square-parking", property.parking == null ? "" : parkingLabel]
  ].filter(([, label]) => label !== "").forEach(([iconClass, label]) => {
    const spec = createElement("span");
    spec.append(createIcon(iconClass), document.createTextNode(` ${label}`));
    specs.append(spec);
  });

  const extras = document.querySelector("#dialogExtras");
  extras.replaceChildren();
  const extraDetails = [
    property.size && `Size: ${property.size}`,
    property.furnishing && `Furnishing: ${property.furnishing}`,
    ...(Array.isArray(property.features) ? property.features : [])
  ].filter(Boolean);
  extras.hidden = extraDetails.length === 0;
  extraDetails.forEach(detail => extras.append(createElement("span", "property-dialog-extra", detail)));

  propertyDialog.showModal();
}

function filterProperties() {
  const purpose = purposeFilter;
  const type = typeSelect.value;
  const location = locationSelect.value;
  let visibleCount = 0;

  propertyCards.forEach(card => {
    const matchesPurpose = purpose === "all" || card.dataset.purpose === purpose;
    const matchesType = type === "all" || card.dataset.type === type;
    const matchesLocation = location === "all" || card.dataset.location === location;
    const showCard = matchesPurpose && matchesType && matchesLocation;
    card.hidden = !showCard;
    if (showCard) visibleCount++;
  });

  emptyState.hidden = visibleCount !== 0;
  resultsLabel.textContent = `${visibleCount} ${visibleCount === 1 ? "home" : "homes"} to explore`;
  document.querySelectorAll(".filter-chip").forEach(chip => {
    const isSelected = chip.dataset.filter === purposeFilter;
    chip.classList.toggle("selected", isSelected);
    chip.setAttribute("aria-pressed", isSelected);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  purposeFilter = purposeSelect.value;
  filterProperties();
  document.querySelector("#properties").scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll(".filter-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    purposeFilter = chip.dataset.filter;
    purposeSelect.value = purposeFilter;
    filterProperties();
  });
});

document.querySelector("#resetFilters").addEventListener("click", () => {
  purposeFilter = "all";
  purposeSelect.value = "all";
  typeSelect.value = "all";
  locationSelect.value = "all";
  filterProperties();
});

propertyGrid.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.classList.contains("save-button")) {
    const isSaved = button.classList.toggle("saved");
    button.replaceChildren(createIcon(isSaved ? "fa-solid fa-heart" : "fa-regular fa-heart"));
    button.setAttribute("aria-pressed", isSaved);
    button.setAttribute("aria-label", isSaved ? "Remove property from favourites" : "Save property to favourites");
    showToast(isSaved ? "Property saved to your favourites." : "Removed from your favourites.");
  }

  if (button.classList.contains("details-button")) {
    const property = propertiesById.get(button.dataset.propertyId);
    if (property) openPropertyDialog(property);
  }
});

document.querySelector("#dialogClose").addEventListener("click", () => propertyDialog.close());

propertyDialog.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    propertyDialog.close();
  }
});

dialogThumbnails.addEventListener("click", event => {
  const thumbnail = event.target.closest(".property-dialog-thumbnail");
  if (!thumbnail) return;

  const thumbnails = [...dialogThumbnails.querySelectorAll(".property-dialog-thumbnail")];
  const selectedIndex = thumbnails.indexOf(thumbnail);
  const images = getPropertyImages(activeProperty);
  dialogImage.src = images[selectedIndex];
  dialogImage.alt = `${activeProperty.title}, photo ${selectedIndex + 1}`;
  thumbnails.forEach((item, index) => item.setAttribute("aria-pressed", index === selectedIndex));
});

propertyDialog.addEventListener("click", event => {
  if (event.target === propertyDialog) propertyDialog.close();
});

document.querySelector("#dialogEnquire").addEventListener("click", () => {
  if (!activeProperty) return;

  const propertyTitle = activeProperty.title;
  document.querySelector('[name="interest"]').value =
    activeProperty.purpose === "Rent" ? "rent" : "buy";
  document.querySelector('[name="preferredLocation"]').value =
    activeProperty.location || activeProperty.displayLocation || "";
  document.querySelector('[name="message"]').value =
    `I'm interested in ${propertyTitle}. Please share more details.`;
  propertyDialog.close();
  document.querySelector("#contact").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => document.querySelector('[name="message"]').focus({ preventScroll: true }), 400);
});

document.querySelector("#contactForm").addEventListener("submit", event => {
  event.preventDefault();
  document.querySelector("#demoNoticeDialog").showModal();
});

const demoNoticeDialog = document.querySelector("#demoNoticeDialog");
document.querySelector("#demoNoticeClose").addEventListener("click", () => demoNoticeDialog.close());
document.querySelector("#demoNoticeDismiss").addEventListener("click", () => demoNoticeDialog.close());

document.querySelectorAll(".service-card a[data-interest]").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelector('[name="interest"]').value = link.dataset.interest;
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();

async function loadProperties() {
  try {
    let properties;
    if (window.location.protocol === "file:") {
      const fallback = document.querySelector("#propertyDataFallback");
      if (!fallback) {
        throw new Error("Offline property data is missing from index.html.");
      }
      properties = JSON.parse(fallback.textContent);
    } else {
      const response = await fetch("./data.json");
      if (!response.ok) {
        throw new Error(`Unable to load data.json (${response.status} ${response.statusText})`);
      }
      properties = await response.json();
    }

    if (!Array.isArray(properties)) {
      throw new Error("data.json must contain an array of properties.");
    }

    propertiesById = new Map(properties.map(property => [String(property.id), property]));
    propertyGrid.replaceChildren(...properties.map(createPropertyCard));
    propertyCards = [...propertyGrid.querySelectorAll(".property-card")];

    filterProperties();
  } catch (error) {
    console.error("Could not load property listings:", error);
    resultsLabel.textContent = "Listings could not be loaded. Check the listing data and try again.";
  }
}

loadProperties();
