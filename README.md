Welcome to **Japan Checklist**, a simple discord bot for creating and managing a checklist for going to Japan!

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

---

## Installation
// ignore this for now, we'll be adding this later on.

To get started with the Japan Trip Planner bot, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/japan-trip-planner.git
   ```

2. **Install dependencies**:
   ```bash
   cd japan-trip-planner
   npm install
   ```

3. **Set up your Discord bot**:
   - Create a new application on the [Discord Developer Portal](https://discord.com/developers/applications).
   - Generate a bot token and add it to your `.env` file.

4. **Run the bot**:
   ```bash
   npm start
   ```

---

## Usage

Here's how you can use Japan Trip Planner in your Discord channel:

- **Create a new checklist**: `/create <trip-name>`\
  Example: `/create My Japan Trip`
  
- **Add an item to your checklist**: `/add <item>`\
  Example: `/add Get passport.`

- **Remove an item from your checklist**: `/remove <index>` \
  Example: `/remove 2` (where 2 is the index of the item you want to remove)

- **View your current trip active**: `/view`\
  Example: `/view`

- **View a specific trip**: `/view <trip-name>`\
  Example: `/view My Japan Trip`

- **list all trips**: `/list`\
  Example: `/list`

- **Delete a trip**: `/delete <trip-ID>`\
  Example: `/delete 1`

- **add users to your trip**: `/adduser <@user> <TripID>`\
  Example: `/adduser @user 1`

- **remove users from your trip**: `/removeuser <@user>`\
  Example: `/removeuser @user`
  
- **Complete an item**: `/complete <index>`\
  Example: `/complete 1`

- **Uncomplete an item**: `/uncomplete <index>`\
  Example: `/uncomplete 2`


---

## Features

Japan Trip Planner offers these handy features:

- **Create Custom Checklists**: Tailor your trip preparation with specific categories like "Travel Essentials," "Cultural Experiences," or "Food Adventures."
  
- **Easy Item Management**: Add, remove, and complete items directly from Discord.

- **Multiple Lists Support**: Organize different aspects of your trip into separate checklists for better clarity.

- **User-Friendly Commands**: Simple and intuitive commands make managing your checklist a breeze.

---

## Contributing

Contributions are welcome! If you'd like to enhance the bot or fix any issues, please follow these guidelines:

1. Fork the repository.
2. Create a new branch for your changes.
3. Commit your changes with clear, concise messages.
4. Push your branch to GitHub.
5. Open a Pull Request against the main branch.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Have fun planning your trip! 🌸