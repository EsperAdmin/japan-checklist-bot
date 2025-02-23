# Japan Checklist Bot

Welcome to **Japan Checklist!**, a Discord bot made to help you plan your trip in Japan. This bot is very simple, add items to your check list and complete them! You can also add other users to your check list for collabrative planning!


## Features

- **Trip Management**: Create up to 10 trips per user, each with a unique UUID.
- **Checklist Items**: Add up to 25 items per trip, mark them as complete/incomplete, and remove them as needed.
- **Collaboration**: Invite others to join your trips via a request/accept system.
- **Pagination**: View trips, items, and more with easy-to-navigate pages.
- **Owner Tools**: Bot owner can manage all trips and blacklist users.
- **Fun Extra**: Get random Japan images with `/japan`.
- **Safety**: Filters out inappropriate language from trip and item names.
- **Stats**: Check bot usage stats like active trips and server count.

## How to Use

### Commands
Run these slash commands in your Discord server:

| Command           | Description                                          | Example Usage                  |
|-------------------|------------------------------------------------------|--------------------------------|
| `/active`         | Set a trip as your active trip using its ID.         | `/active trip_id:<uuid>`       |
| `/add`            | Add an item to your active trip (max 25).            | `/add item:Sunscreen`          |
| `/adduser`        | Send a request to add a user to your active trip.    | `/adduser user:@Friend`        |
| `/admin`          | Owner-only: View/manage all trips.                   | `/admin blacklist`             |
| `/manage`         | Multi use command with sub command to manage your trip! | `/manage delete`            |
| `/create`         | Create a new trip (max 10) and set it as active.     | `/create name:Beach Trip`      |
| `/help`           | View all commands with details (paginated).          | `/help`                        |
| `/japan`          | Get a random image of Japan.                         | `/japan`                       |
| `/list`           | List all your trips with pagination.                 | `/list`                        |
| `/requests`       | View and accept/decline trip join requests.          | `/requests`                    |
| `/stats`          | View bot statistics.                                 | `/stats`                       |
| `/view`           | View your active trip or a specific trip by name.    | `/view name:Beach Trip`        |

### Example Workflow
1. **Create a Trip**: `/create name:Road Trip`
2. **Add Tasks**: `/add item:get passport`, `/add item:get plain ticket`
3. **Invite a Friend**: `/manage adduser user:@Friend`
4. **Friend Accepts**: Friend runs `/requests` and clicks "Accept"
5. **Manage Checklist**: `/manage complete item_id:1`, `/view`

## Setup Instructions

### Prerequisites
- **Node.js**: v16 or higher
- **npm**: For package installation
- **MongoDB**: A running instance (local or cloud, e.g., MongoDB Atlas)
- **Discord Bot Token**: Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
- **Unsplash API Key**: For the `/japan` command (get from [Unsplash Developers](https://unsplash.com/developers))

### Installation and running the bot
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/EsperAdmin/japan-checklist-bot.git
   cd japan-checklist-bot
   
2. **Install Dependencies**: 
   ```bash
   npm install
   
3. **Set Environment Variables** (in `.env` file):
   - `DISCORD_TOKEN`: Your Discord bot token.
   - `MONGODB_URI`: The URI for your MongoDB instance.
   - `UNSPLASH_ACCESS_KEY`: Unsplash API key.

4. **Start the Bot**:
   ```bash 
   node shard.js

## Extra information
This bot was created with the help of the [Discord.js](https://discordjs.guide/) library and [MongoDB](https://www.mongodb.com/). It's a great way to learn about these technologies while building something useful. Enjoy your journey into the world of Discord bots! Also with help from Grok3/Qwen2.5-coder:32b and @EsperAdmin





