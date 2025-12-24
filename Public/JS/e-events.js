const AllEvents = document.getElementById("AllEventsButton")
const RegisteredEvents = document.getElementById("RegisteredEventsButton")
const addEventButton = document.getElementById("addEventButton");
let visibleCount = 5;

//#region Show All Events
document.addEventListener("DOMContentLoaded", async () => {
    const account_id = localStorage.getItem("account_id") ? parseInt(localStorage.getItem("account_id")) : 1;
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const EventsContainer = document.getElementById("AllEventsContainer");

    if (!EventsContainer) {
        console.error("EventsContainer element not found in the DOM.");
        return;
    }

    if (user.account_type === "o") {
        addEventButton.hidden = false; // Show add event button for organizers
        RegisteredEvents.hidden = true;
    }
    else {
        addEventButton.hidden = true; // Hide add event button for non-organizers
        RegisteredEvents.hidden = false;
    }

    await displayAllEvents();
});

//#endregion


//#region Show All Events
AllEvents.addEventListener("click", async () => {

    await displayAllEvents();
})

async function displayAllEvents() {
    RegisteredEvents.classList.remove("selected")
    AllEvents.classList.add("selected")
    const user = JSON.parse(localStorage.getItem("user")) || {};

    const EventsContainer = document.getElementById("AllEventsContainer")

    if (!user) {
        console.error("User data not found in localStorage.");
        return;
    }

    if (!EventsContainer) {
        console.error("EventsContainer element not found in the DOM.");
        return;
    }
    //get all events from the database
    try {
        const response = await fetch("/getAllEvents", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token || ""}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        window.allEvents = data;
        console.log("Fetched Events:", data);


        EventsContainer.innerHTML = "";

        visibleCount = 5;
        renderEvents();

    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        EventsContainer.innerHTML = "<p>There are currently no events. Please try again later.</p>";
    }
};

//#endregion

//#region Show Registered Events
RegisteredEvents.addEventListener("click", async (event) => {
    await displayRegistered();
});

async function displayRegistered() {
    AllEvents.classList.remove("selected")
    RegisteredEvents.classList.add("selected")

    const account_id = localStorage.getItem("account_id") ? parseInt(localStorage.getItem("account_id")) : null;
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const EventsContainer = document.getElementById("AllEventsContainer")
    if (!EventsContainer) {
        console.error("EventsContainer element not found in the DOM.");
        return;
    }
    //get all registered events from the database for specific user
    try {
        const response = await fetch(`/getEventRegisteredByID`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token || ""}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Network error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("Fetched Registered Events:", data);

        EventsContainer.innerHTML = "";

        if (Array.isArray(data) && data.length > 0) {
            data.forEach(event => {
                const html = renderEvent(event, user.account_type, "registered");
                EventsContainer.innerHTML += html;

            });
        } else {
            EventsContainer.innerHTML = "<p>No events found.</p>";
        }
    } catch (error) {
        console.error("There was a problem with the fetch operation:", error);
        EventsContainer.innerHTML = "<p>There are currently no events. Please try again later.</p>";
    }
}
//#endregion

//#region Event Registration and Unregistration
document.getElementById("EventsContainer").addEventListener("click", async function (event) {
    if (event.target.classList.contains("unregister-button")) {
        const button = event.target;
        const eventId = button.getAttribute("data-event-id");

        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;
        const accId = user?.id;

        if (!token || !accId) {
            showMessagePopover("You must be logged in to unregister.");
            return;
        }

        try {
            const response = await fetch(`/unregisterEvent/${eventId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                },
            });

            const result = await response.json();

            if (response.ok) {
                showMessagePopover("Successfully unregistered from the event.");
                document.getElementById(`event-${eventId}`).remove();
            } else {
                showMessagePopover(result.message || "Unregister failed.");
            }
        } catch (error) {
            console.error("Unregister error:", error);
            showMessagePopover("Something went wrong.");
        }
    }
});

//Event registration
document.getElementById("EventsContainer").addEventListener("click", async function (event) {
    if (event.target.classList.contains("register-button")) {
        const button = event.target;
        const eventId = button.getAttribute("data-event-id");

        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;
        const accId = user?.id;

        if (!token || !accId) {
            showMessagePopover("You must be logged in to register.");
            return;
        }
        //fetch request to register for the event
        try {
            const response = await fetch(`/registerEvent/${eventId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}`
                },
            });

            const result = await response.json();

            if (response.ok) {
                showMessagePopover("Successfully registered for the event. Your details will be sent to the organizer.");
                // Optional: change button text or disable it
            } else {
                showMessagePopover(result.message || "Failed to register.");
            }
        } catch (error) {
            console.error("Register error:", error);
            showMessagePopover("An error occurred during registration.");
        }
    }
});
//#endregion


//#region Render Events for All Events and Registered Events
function renderEvents() {
    const EventsContainer = document.getElementById("AllEventsContainer");
    const user = JSON.parse(localStorage.getItem("user")) || {};

    if (!window.allEvents || !Array.isArray(window.allEvents)) {
        EventsContainer.innerHTML = "<p>No events found.</p>";
        return;
    }

    EventsContainer.innerHTML = ""; // Clear previous contents

    const events = window.allEvents.slice(0, visibleCount);

    events.forEach(event => {
        const html = renderEvent(event, user.account_type, "view");
        EventsContainer.innerHTML += html;
    });

    // Manage visibility of the button
    const seeMoreBtn = document.getElementById("seeMoreBtn");
    if (visibleCount >= window.allEvents.length) {
        seeMoreBtn.style.display = "none";
    } else {
        seeMoreBtn.style.display = "block";
    }
}

document.getElementById("seeMoreBtn").addEventListener("click", () => {
    visibleCount += 5;
    renderEvents();
});

function renderEvent(event, userRole, view) {
    const date = event.date.substring(0, 10);
    // Handle time format - could be "HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
    let time;
    if (event.time.includes('T')) {
        // Full datetime format
        time = event.time.substring(11, 16);
    } else {
        // Just time format (HH:MM:SS)
        time = event.time.substring(0, 5);
    }

    const datetime = `${date}T${time}:00`;
    const eventDate = new Date(datetime);

    const formattedDate = eventDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    let actionButton = "";
    if (view === "registered") {
        actionButton = `<button class="unregister-button" data-event-id="${event.id}">Unregister</button>`;
    } else if (userRole === "o") {
        actionButton = `<button class="edit-button" data-event-id="${event.id}">Edit event</button>
                        <button class="delete-button" data-event-id="${event.id}">Delete event</button>`;
    } else if (userRole === "e" || userRole === "c") {
        actionButton = `<button class="register-button" data-event-id="${event.id}">Register</button>`;
    }

    return `
        <div class="event-card" id="event-${event.id}">
            <div class="event-image">
                <img src="${event.banner_image || "Assets/logo.png"}" alt="placeholder image">
            </div>
            <div class="event-details">
                <h2>${event.name}</h2>
                <p>Date: ${formattedDate}</p>
                <p>Time: ${formattedTime}</p>
                <p>Location: ${event.location}</p>
            </div>
            <div class="action-buttons">${actionButton}</div>
        </div>
    `;
}



document.addEventListener("click", function (e) {
    const card = e.target.closest(".event-card");
    const isButton = e.target.classList.contains("register-button") ||
        e.target.classList.contains("unregister-button") ||
        e.target.classList.contains("edit-button") ||
        e.target.classList.contains("delete-button");

    if (card && !isButton) {
        const eventId = card.id.replace("event-", "");
        const event = window.allEvents?.find(ev => ev.id == eventId);
        if (event) {
            showEventModal(event);
        }
    }
});

function showEventModal(event) {
    const modal = document.getElementById("eventModal");

    const date = event.date.substring(0, 10);
    // Handle time format - could be "HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
    let time;
    if (event.time.includes('T')) {
        // Full datetime format
        time = event.time.substring(11, 16);
    } else {
        // Just time format (HH:MM:SS)
        time = event.time.substring(0, 5);
    }

    const datetime = `${date}T${time}:00`;
    const eventDate = new Date(datetime);

    const formattedDate = eventDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = eventDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

    document.getElementById("modalName").textContent = event.name;
    document.getElementById("modalDescription").textContent = event.description || "N/A";
    document.getElementById("modalDate").textContent = formattedDate;
    document.getElementById("modalTime").textContent = formattedTime;
    document.getElementById("modalLocation").textContent = event.location || "N/A";
    document.getElementById("modalWeekly").textContent = event.weekly ? "Yes" : "No";
    document.getElementById("modalEquipment").textContent = event.equipment_required || "None";
    document.getElementById("modalImage").src = event.banner_image || "Assets/logo.png";

    modal.classList.add("show");
}

document.getElementById("modalClose").addEventListener("click", () => {
    document.getElementById("eventModal").classList.remove("show");
});
//#endregion


//#region Add Event for organizers only
const addEventModal = document.getElementById("addEventModalBackdrop");
const closeAddEventModal = document.getElementById("closeAddEventModal");

addEventButton.addEventListener("click", function () {
    addEventModal.classList.remove("hidden");
});

closeAddEventModal.addEventListener("click", function () {
    addEventModal.classList.add("hidden");
});

document.getElementById("addEventForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const form = e.target;
    var user = JSON.parse(localStorage.getItem("user")) || {};

    const name = form.name.value
    const description = form.description.value
    const date = form.date.value
    const time = form.time.value
    const location = form.location.value
    const equipment_required = form.equipment_required.value
    const weekly = form.weekly.checked
    const org_id = user.id
    const imageFile = form.image.files[0];
    //form inputs
    let banner_image = "";
    if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);
        imageFormData.append("upload_preset", "bed-eventpics");
        imageFormData.append("cloud_name", "dixpuc6o7");

        try { //post image to cloudinary first
            const imageUploadResponse = await fetch("https://api.cloudinary.com/v1_1/dixpuc6o7/image/upload", {
                method: "POST",
                body: imageFormData,
            });

            if (!imageUploadResponse.ok) {
                throw new Error(imageUploadResponse.body);
            }

            const imageData = await imageUploadResponse.json();
            banner_image = imageData.secure_url; // Use the secure_url to get the image URL
        } catch (error) {
            console.error("Error uploading image:", error);
            showMessagePopover("Failed to upload image.");
            return;
        }
    }
    //upload event data to the database
    const formData = {
        name: name,
        description: description,
        date: date,
        time: time,
        location: location,
        equipment_required: equipment_required,
        weekly: weekly,
        org_id: org_id,
        banner_image: banner_image
    };

    console.log("Form Data:", formData);

    try {
        const response = await fetch("/createEvent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        showMessagePopover("Event created successfully!");
        addEventModal.classList.add("hidden");
        form.reset();
        await displayAllEvents(); // Refresh list
    } catch (err) {
        console.error("Failed to create event:", err);
        showMessagePopover("Failed to create event.");
    }
});

//#endregion

//#region Edit Event for organizers only
const editEventModal = document.getElementById("editEventModalBackdrop");
const closeEditEventModal = document.getElementById("closeEditEventModal");
const editEventForm = document.getElementById("editEventForm");

let editingEvent = null; // Store the event being edited

document.addEventListener("click", function (e) {
    const editBtn = e.target.closest(".edit-button");
    if (editBtn) {
        const eventId = editBtn.dataset.eventId;
        const event = window.allEvents?.find(ev => ev.id == eventId);
        if (event) {
            editingEvent = event;
            openEditEventModal(event);
        } else {
            console.warn("Event not found for ID:", eventId);
        }
    }
});

function openEditEventModal(event) {
    editEventForm.id.value = event.id;
    editEventForm.name.value = event.name;
    editEventForm.description.value = event.description;
    //show only event details besides the banner image
    if (event.date) {
        const date = new Date(event.date);
        editEventForm.date.value = date.toISOString().split("T")[0];
    }

    if (event.time) {
        // Handle time format - could be "HH:MM:SS" or "YYYY-MM-DDTHH:MM:SS"
        if (event.time.includes('T')) {
            editEventForm.time.value = event.time.substring(11, 16);
        } else {
            editEventForm.time.value = event.time.substring(0, 5);
        }
    }

    editEventForm.location.value = event.location;
    editEventForm.weekly.checked = !!event.weekly;
    editEventForm.equipment_required.value = event.equipment_required || "";
    editEventModal.classList.remove("hidden");
}

closeEditEventModal.addEventListener("click", function () {
    editEventModal.classList.add("hidden");
});

editEventModal.addEventListener("click", function (e) {
    if (e.target === editEventModal) {
        editEventModal.classList.add("hidden");
    }
});

editEventForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user")) || {};
    const imageInput = editEventForm.banner_image;
    const imageFile = imageInput && imageInput.files && imageInput.files[0];

    let banner_image = editingEvent?.banner_image || "";
    // If no new image is uploaded, keep the old image URL
    if (imageFile) {
        // If user uploads a new image, upload to Cloudinary and use new URL
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);
        imageFormData.append("upload_preset", "bed-eventpics");
        imageFormData.append("cloud_name", "dixpuc6o7");

        try {
            const imageUploadResponse = await fetch("https://api.cloudinary.com/v1_1/dixpuc6o7/image/upload", {
                method: "POST",
                body: imageFormData,
            });

            if (!imageUploadResponse.ok) {
                throw new Error(await imageUploadResponse.text());
            }

            const imageData = await imageUploadResponse.json();
            banner_image = imageData.secure_url;
        } catch (error) {
            console.error("Error uploading image:", error);
            showMessagePopover("Failed to upload image.");
            return;
        }
    }


    const formData = {
        id: editEventForm.id.value,
        name: editEventForm.name.value,
        description: editEventForm.description.value,
        date: editEventForm.date.value,
        time: editEventForm.time.value,
        location: editEventForm.location.value,
        equipment_required: editEventForm.equipment_required.value,
        banner_image: banner_image,
        weekly: editEventForm.weekly.checked,
        org_id: user.id
    };

    try { // Send the updated event data to the server
        const response = await fetch(`/updateEvent/${formData.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${user.token}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error("Failed to update event");

        showMessagePopover("Event updated.");
        editEventModal.classList.add("hidden");
        await displayAllEvents();
    } catch (err) {
        console.error(err);
        showMessagePopover("Update failed.");
    }
});
//#endregion

//#region Delete Event for organizers only
document.getElementById("EventsContainer").addEventListener("click", async function (event) {
    if (event.target.classList.contains("delete-button")) {
        const button = event.target;
        const eventId = button.getAttribute("data-event-id");

        const user = JSON.parse(localStorage.getItem("user"));
        const token = user?.token;

        if (!token) {
            showMessagePopover("You must be logged in to delete an event.");
            return;
        }

        if (!confirm("Are you sure you want to delete this event?")) {
            return;
        }
        // Send a DELETE request to the server to delete the event
        try {
            const response = await fetch(`/deleteEvent/${eventId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Network error: ${response.status} - ${errorText}`);
            }

            showMessagePopover("Event deleted successfully.");
            document.getElementById(`event-${eventId}`).remove();
        } catch (error) {
            console.error("Delete error:", error);
            showMessagePopover("An error occurred while deleting the event.");
        }
    }
});
//#endregion


//#region Message Popover for any messages
function showMessagePopover(message, timeout = 3000) {
    const popover = document.getElementById('messagePopover');
    const msgSpan = document.getElementById('popoverMessage');
    if (popover && msgSpan) {
        msgSpan.textContent = message;
        popover.classList.remove('hidden');
        if (timeout > 0) {
            setTimeout(() => popover.classList.add('hidden'), timeout);
        }
    } else {
        console.error("Popover or message span not found in the DOM.");
    }
}


document.getElementById('closePopover').onclick = function () {
    document.getElementById('messagePopover').classList.add('hidden');
};














