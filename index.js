const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config.json');

/**
 * Main function to start the process
 */
async function main() {
    console.log('======================================');
    console.log('Démarrage du processus multi-serveur DM');
    console.log('======================================');
    
    const serverPromises = config.servers.map((serverConfig, index) => {
        return processServer(serverConfig, index, config.servers.length);
    });
    
    await Promise.all(serverPromises);
    
    console.log('Tous les serveurs ont été traités avec succès!');
}

/**
 * Process a single server from the config
 */
async function processServer(serverConfig, serverIndex, totalServers) {
    console.log('\n======================================');
    console.log(`Traitement du serveur ${serverIndex + 1}/${totalServers}`);
    console.log(`ID du serveur: ${serverConfig.guildId}`);
    console.log('======================================\n');

    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.DirectMessages
        ],
        partials: [Partials.Channel, Partials.Message]
    });

    return new Promise((resolve, reject) => {
        client.once('ready', async () => {
            try {
                console.log(`Connecté en tant que ${client.user.tag}!`);
                console.log(`ATTENTION: L'envoi massif de DMs peut violer les conditions d'utilisation de Discord.`);
                
                await startDMAllProcess(client, serverConfig);
            } catch (error) {
                console.error(`Erreur lors du traitement du serveur ${serverIndex + 1}:`, error);
            } finally {
                client.destroy();
                console.log(`Bot déconnecté du serveur ${serverIndex + 1}`);
                resolve();
            }
        });
        
        client.on('error', (error) => {
            console.error(`Erreur client Discord:`, error);
            client.destroy();
            reject(error);
        });
        
        client.login(serverConfig.token).catch(error => {
            console.error(`Échec de connexion:`, error);
            reject(error);
        });
    });
}

/**
 * Start the DMing process for a server
 */
async function startDMAllProcess(client, serverConfig) {
    const guild = client.guilds.cache.get(serverConfig.guildId);
    if (!guild) {
        console.error('Serveur non trouvé! Vérifiez que le bot est bien dans le serveur et que l\'ID est correct.');
        return;
    }

    console.log(`Démarrage de l'envoi de DMs aux membres de ${guild.name}`);

    try {
        console.log(`Récupération des membres de ${guild.name}...`);
        await guild.members.fetch();
        console.log(`Membres de ${guild.name} récupérés avec succès!`);
        
        const members = guild.members.cache.filter(member => 
            !member.user.bot && member.id !== client.user.id);
        
        const memberArray = Array.from(members.values());
        const totalMembers = memberArray.length;
        
        console.log(`Préparation à l'envoi de DMs à ${totalMembers} membres de ${guild.name}`);
        
        const stats = {
            total: totalMembers,
            success: 0,
            failed: 0,
            rateLimited: 0,
            dmClosed: 0
        };
        
        await processMemberQueue(memberArray, stats, serverConfig.message, guild);
        
    } catch (err) {
        console.error(`Erreur lors du traitement des membres de ${guild.name}:`, err);
    }
}

/**
 * Process the queue of members to DM
 */
async function processMemberQueue(memberArray, stats, message, guild) {
    const baseDelay = 5000;
    const rateLimitDelay = 60000;
    
    for (let i = 0; i < memberArray.length; i++) {
        const member = memberArray[i];
        const currentPosition = `[${i + 1}/${stats.total}]`;
        const guildInfo = `[${guild.name}]`;
        
        try {
            await member.send(message);
            stats.success++;
            console.log(`${guildInfo} ${currentPosition} Message envoyé à ${member.user.tag} (ID: ${member.id})`);
            
            const delay = baseDelay + Math.floor(Math.random() * 5000);
            await sleep(delay);
            
        } catch (error) {
            handleDMError(error, member, currentPosition, stats, guild);
            
            if (error.code === 40003 || error.code === 'RATE_LIMITED') {
                await sleep(rateLimitDelay);
            } else {
                await sleep(baseDelay);
            }
        }
    }
    
    logStats(stats, guild);
}

/**
 * Handle errors when sending DMs
 */
function handleDMError(error, member, position, stats, guild) {
    const guildInfo = `[${guild.name}]`;
    
    if (error.code === 50007) {
        console.warn(`${guildInfo} ${position} ${member.user.tag} (ID: ${member.id}) a les DMs bloqués`);
        stats.dmClosed++;
        stats.failed++;
    } else if (error.code === 10002 || error.code === 10013) {
        console.warn(`${guildInfo} ${position} Utilisateur ${member.user.tag} (ID: ${member.id}) non trouvé ou plus dans le serveur`);
        stats.failed++;
    } else if (error.code === 40003 || error.code === 'RATE_LIMITED') {
        console.warn(`${guildInfo} ${position} Rate limited! Attente avant de continuer...`);
        stats.rateLimited++;
    } else {
        console.error(`${guildInfo} ${position} Échec d'envoi du message à ${member.user.tag}: ${error.message} (Code: ${error.code})`);
        stats.failed++;
    }
}

/**
 * Log final statistics
 */
function logStats(stats, guild) {
    console.log(`======================================`);
    console.log(`Processus DM terminé pour ${guild.name}!`);
    console.log(`Total des membres: ${stats.total}`);
    console.log(`Envoyés avec succès: ${stats.success}`);
    console.log(`Échecs d'envoi: ${stats.failed}`);
    console.log(`DMs bloqués: ${stats.dmClosed}`);
    console.log(`Rate limited: ${stats.rateLimited} fois`);
    console.log(`======================================`);
}

/**
 * Helper function to create a delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
    console.error('Erreur fatale dans le processus principal:', err);
    process.exit(1);
});