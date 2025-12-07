# TaskManager by ZF Group

A simple and modern task management web application built primarily for student use. This project features a premium UI design with an attractive Purple-Pink gradient theme, interactive data visualizations, and client-side data persistence.

## Key Features

TaskManager Premium is designed to help students manage their assignments and tasks more efficiently and professionally.

### Dashboard and Analytics
* **Data Visualization**: Utilizes **ApexCharts** to display statistics on pending tasks by priority (Donut Chart) and overall completion rate (Radial Bar).
* **Performance Metrics**: Dynamic metric cards display total tasks, completed tasks, and completion rate.
* **Upcoming Lists**: Displays class schedules and upcoming task deadlines.

### Full Task Management (CRUD)
* **Task Operations**: Supports basic CRUD operations (Create, Read, Update Title, Delete, Complete/Reopen).
* **Priority & Subject**: Tasks can be marked with priority (High, Medium, Low) and labelled by subject (e.g., IMS566, CSC508).

### Local User System
* **Local Storage**: User and task data are stored locally in the browser's `localStorage`.
* **Register & Login**: A simple authentication system to simulate the registered user experience.

## Technologies Used

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript | Core Application Structure and Logic |
| **Framework** | [Bootstrap 5.3](https://getbootstrap.com/) | CSS Framework & UI Components (Mobile) |
| **Icons** | [Bootstrap Icons](https://icons.getbootstrap.com/) |
| **Data Visualization** | [ApexCharts](https://apexcharts.com/) | Creating Interactive Dashboard Charts |
| **Styling** | CSS Variables | Efficient Theme and Color Management |

## How to Run the Project

This project only uses HTML, CSS, and JavaScript, making it very easy to launch.

1.  **Clone the Repository:**
    ```bash
    git clone [YOUR REPO ADDRESS]
    cd TaskManager-Premium
    ```
2.  **Open the Project:**
    Open the `index.html` file using your favorite web browser (Chrome, Firefox, etc.). You can also use the **Live Server** extension in VS Code.
3.  **Log In or Register:**
    Use the demo account or register a new one.

## Demo & Test Account for user to test

A demo account is provided by default in your `localStorage`:

| Field | Value |
| :--- | :--- |
| **Username** | `student` |
| **Password** | `password123` |
