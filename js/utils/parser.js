/**
 * Markdown parser for beast and spell data
 * Parses markdown files from 5etools format
 */
const Parser = (function() {
    /**
     * Parse beast markdown data
     * @param {string} markdown - Markdown content
     * @returns {Array} Array of parsed beast objects
     */
    const parseBeastMarkdown = (markdown) => {
        const beasts = [];
        
        // Use regex to find complete beast blocks instead of splitting by '___'
        // This handles the variable structure of the markdown better
        const beastSectionRegex = /___\s+>## ([^\r\n]+)\s+>([^\r\n]+)([\s\S]*?)(?=___\s+>## |$)/g;
        
        let match;
        while ((match = beastSectionRegex.exec(markdown)) !== null) {
            try {
                const name = match[1].trim();
                const typeInfo = match[2].trim().replace(/^\*|\*$/g, ''); // Remove asterisks
                // The full content block after name and type
                const contentBlock = match[3];
                
                // Validate we have the expected content
                if (!contentBlock.includes('**Armor Class**') || !contentBlock.includes('**Challenge**')) {
                    console.error(`Beast ${name} is missing required fields`);
                    continue;
                }
                
                // Parse size, type, and alignment
                const typeInfoParts = typeInfo.split(',');
                const sizeAndType = typeInfoParts[0].trim().split(' ');
                const size = sizeAndType[0];
                const type = sizeAndType.slice(1).join(' ');
                const alignment = typeInfoParts[1]?.trim() || 'unaligned';
                
                // Parse basic stats
                const acMatch = contentBlock.match(/>- \*\*Armor Class\*\* ([^\r\n]+)/);
                const hpMatch = contentBlock.match(/>- \*\*Hit Points\*\* ([^\r\n]+)/);
                const speedMatch = contentBlock.match(/>- \*\*Speed\*\* ([^\r\n]+)/);
                
                // Parse ability scores - use a more robust method
                const abilities = parseAbilityScoresTable(contentBlock);
                
                // Parse additional attributes
                const skillsMatch = contentBlock.match(/>- \*\*Skills\*\* ([^\r\n]+)/);
                const sensesMatch = contentBlock.match(/>- \*\*Senses\*\* ([^\r\n]+)/);
                const languagesMatch = contentBlock.match(/>- \*\*Languages\*\* ([^\r\n]+)/);
                const crMatch = contentBlock.match(/>- \*\*Challenge\*\* ([^\r\n]+)/);
                const profBonusMatch = contentBlock.match(/>- \*\*Proficiency Bonus\*\* ([^\r\n]+)/);
                
                // Parse traits (before Actions section)
                const traits = [];
                const traitMatches = contentBlock.matchAll(/>\*\*\*([^\.]+)\.\*\*\* ([^]*?)(?=>\*\*\*|>### Actions|$)/g);
                
                for (const traitMatch of traitMatches) {
                    // Only add if it's before the actions section
                    if (contentBlock.indexOf(traitMatch[0]) < contentBlock.indexOf('>### Actions') || 
                        contentBlock.indexOf('>### Actions') === -1) {
                        traits.push({
                            name: traitMatch[1].trim(),
                            description: traitMatch[2].trim()
                        });
                    }
                }
                
                // Parse actions
                const actions = [];
                const actionSection = contentBlock.indexOf('>### Actions');
                
                if (actionSection !== -1) {
                    const actionContent = contentBlock.substring(actionSection);
                    
                    // Find actions but stop at '> null' marker
                    const nullMarkerIndex = actionContent.indexOf('> null');
                    const cleanActionContent = nullMarkerIndex !== -1 
                        ? actionContent.substring(0, nullMarkerIndex) 
                        : actionContent;
                    
                    // Process action content
                    const actionMatches = cleanActionContent.matchAll(/>\*\*\*([^\.]+)\.\*\*\* ([^]*?)(?=>\*\*\*|$)/g);
                    
                    for (const actionMatch of actionMatches) {
                        actions.push({
                            name: actionMatch[1].trim(),
                            description: actionMatch[2].trim()
                        });
                    }
                }
                
                // Extract environment info from additional text (if present)
                let environment = '';
                let additionalText = '';
                
                // Look for additional text after the statblock (may contain environment info)
                const additionalContentMatch = contentBlock.match(/\r?\n\r?\n## ([^\r\n]+)(?:\r?\n\r?\n([^]*?))?$/);
                if (additionalContentMatch) {
                    // The header after the statblock is often the monster name + environment
                    const headerText = additionalContentMatch[1].trim();
                    
                    // Try to derive environment from the header or description
                    if (headerText.includes('Forest') || (additionalContentMatch[2] && additionalContentMatch[2].includes('forest'))) {
                        environment = 'Forest';
                    } else if (headerText.includes('Hill') || (additionalContentMatch[2] && additionalContentMatch[2].includes('hill'))) {
                        environment = 'Hill';
                    } else if (headerText.includes('Grassland') || (additionalContentMatch[2] && additionalContentMatch[2].includes('grassland'))) {
                        environment = 'Grassland';
                    }
                    
                    // Additional description text
                    if (additionalContentMatch[2]) {
                        additionalText = additionalContentMatch[2].trim();
                    }
                }
                
                // Parse CR to handle fractions and XP
                let cr = crMatch ? crMatch[1].trim() : '0';
                // Extract just the CR value excluding XP in parentheses
                const crExtractionMatch = cr.match(/^([0-9\/]+)/);
                if (crExtractionMatch) {
                    cr = crExtractionMatch[1];
                }
                
                // Construct the beast object
                const beast = {
                    id: Database.generateUUID(),
                    name,
                    size,
                    type,
                    alignment,
                    ac: acMatch ? acMatch[1].trim() : '',
                    hp: hpMatch ? hpMatch[1].trim() : '',
                    speed: speedMatch ? speedMatch[1].trim() : '',
                    abilities: abilities || {
                        str: { score: 10, modifier: '+0' },
                        dex: { score: 10, modifier: '+0' },
                        con: { score: 10, modifier: '+0' },
                        int: { score: 10, modifier: '+0' },
                        wis: { score: 10, modifier: '+0' },
                        cha: { score: 10, modifier: '+0' }
                    },
                    skills: skillsMatch ? skillsMatch[1].trim() : '',
                    senses: sensesMatch ? sensesMatch[1].trim() : '',
                    languages: languagesMatch ? languagesMatch[1].trim() : '',
                    cr,
                    profBonus: profBonusMatch ? profBonusMatch[1].trim() : '',
                    traits,
                    actions,
                    environment,
                    additionalText
                };
                
                beasts.push(beast);
                
            } catch (error) {
                console.error('Error parsing beast block:', error);
                // Continue with next beast even if there's an error
            }
        }
        
        return beasts;
    };
    
    /**
     * Parse ability score from markdown
     * @param {string} abilityText - Text containing ability score
     * @returns {Object} Object with score and modifier
     */
    const parseAbilityScore = (abilityText) => {
        // Clean up the text - remove '>' and any extra whitespace
        const cleanText = (abilityText || '').trim().replace(/^>\s*/, '');
        
        // More flexible regex that handles variations in spacing
        const match = cleanText.match(/(\d+)\s*\(([+-]\d+)\)/);
        if (match) {
            return {
                score: parseInt(match[1], 10),
                modifier: match[2]
            };
        }
        console.warn("Failed to parse ability score from: '", abilityText, "'");
        return { score: 10, modifier: '+0' };
    };
    
    /**
     * Parse ability scores table from markdown content
     * @param {string} contentBlock - The content block containing the ability scores table
     * @returns {Object|null} Object with parsed ability scores or null if parsing failed
     */
    const parseAbilityScoresTable = (contentBlock) => {
        try {
            // Split the content into lines
            const lines = contentBlock.split('\n');
            
            // Find the ability score table header line
            let headerLineIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes('|STR|DEX|CON|INT|WIS|CHA|')) {
                    headerLineIndex = i;
                    break;
                }
            }
            
            // If we couldn't find the header, return null
            if (headerLineIndex === -1) {
                console.warn("Couldn't find ability score header");
                return null;
            }
            
            // The values should be on the third line of the table (header + separator + values)
            const valuesLineIndex = headerLineIndex + 2;
            if (valuesLineIndex >= lines.length) {
                console.warn("Ability score table is incomplete");
                return null;
            }
            
            const valuesLine = lines[valuesLineIndex];
            
            // Clean the line (remove leading > character if present)
            const cleanLine = valuesLine.replace(/^>\s*/, '');
            
            // Split by | and remove first and last empty entries which are just the table border
            const cells = cleanLine.split('|').filter(Boolean);
            
            // Should have exactly 6 ability scores
            if (cells.length !== 6) {
                console.warn("Unexpected number of ability scores:", cells.length, "Line:", valuesLine);
                return null;
            }
            
            // Parse each ability score
            return {
                str: parseAbilityScore(cells[0].trim()),
                dex: parseAbilityScore(cells[1].trim()),
                con: parseAbilityScore(cells[2].trim()),
                int: parseAbilityScore(cells[3].trim()),
                wis: parseAbilityScore(cells[4].trim()),
                cha: parseAbilityScore(cells[5].trim())
            };
        } catch (error) {
            console.error("Error parsing ability scores table:", error);
            return null;
        }
    };
    
    /**
     * Parse spell markdown data
     * @param {string} markdown - Markdown content
     * @returns {Array} Array of parsed spell objects
     */
    const parseSpellMarkdown = (markdown) => {
        const spells = [];
        
        // Normalize line endings to \n for consistent processing
        const normalizedMarkdown = markdown.replace(/\r\n/g, '\n');
        
        // Regex to match spell blocks - look for #### headers
        const spellHeaderRegex = /^#### ([^\n]+)\n([\s\S]*?)(?=^#### |$)/gm;
        
        let match;
        let spellCount = 0;
        
        while ((match = spellHeaderRegex.exec(normalizedMarkdown)) !== null) {
            try {
                spellCount++;
                console.log(`Found spell ${spellCount}: ${match[1]}`);
                
                const name = match[1].trim();
                const spellContent = match[2];
                
                // Extract level and school
                const levelSchoolMatch = spellContent.match(/^\*([^*]+)\*/m);
                if (!levelSchoolMatch) {
                    console.warn(`Could not extract level/school for ${name}`);
                    continue;
                }
                
                const levelSchool = levelSchoolMatch[1].trim();
                
                // Determine spell level
                let level = 0;
                if (levelSchool.toLowerCase().includes('cantrip')) {
                    level = 0;
                } else {
                    const levelMatch = levelSchool.match(/(\d+)[a-z]{2}-level/);
                    if (levelMatch) {
                        level = parseInt(levelMatch[1], 10);
                    } else {
                        console.warn(`Could not determine level for ${name}: ${levelSchool}`);
                    }
                }
                
                // Extract school
                let school = '';
                const schoolMatch = levelSchool.match(/(?:cantrip|level) (\w+)/);
                if (schoolMatch) {
                    school = schoolMatch[1].toLowerCase();
                } else {
                    console.warn(`Could not determine school for ${name}: ${levelSchool}`);
                }
                
                // Extract meta properties
                const metaSection = spellContent.match(/^___\n([\s\S]*?)^---/m);
                const metaProperties = {};
                
                if (metaSection) {
                    const metaLines = metaSection[1].split('\n');
                    
                    for (const line of metaLines) {
                        const metaMatch = line.match(/^- \*\*([^:]+):\*\* (.+)$/);
                        if (metaMatch) {
                            const key = metaMatch[1].trim().toLowerCase().replace(/\s+/g, '');
                            const value = metaMatch[2].trim();
                            metaProperties[key] = value;
                        }
                    }
                } else {
                    console.warn(`Could not extract meta properties for ${name}`);
                }
                
                // Extract main description
                let description = '';
                const mainSection = spellContent.match(/^---\n([\s\S]*?)(?=\*\*\*At Higher Levels\.|^\*\*Classes:|$)/m);
                
                if (mainSection) {
                    description = mainSection[1].trim();
                } else {
                    console.warn(`Could not extract description for ${name}`);
                }
                
                // Extract higher levels section
                let higherLevels = '';
                const higherLevelsMatch = spellContent.match(/\*\*\*At Higher Levels\.\*\*\* ([\s\S]*?)(?=^\*\*Classes:|$)/m);
                
                if (higherLevelsMatch) {
                    higherLevels = higherLevelsMatch[1].trim();
                }
                
                // Extract classes
                let classes = [];
                const classesMatch = spellContent.match(/^\*\*Classes:\*\* (.*)$/m);
                
                if (classesMatch) {
                    console.log(`Classes for ${name}: '${classesMatch[1]}'`);
                    classes = classesMatch[1].split(', ').map(c => c.trim());
                } else {
                    console.warn(`No classes found for ${name}`);
                }
                
                // Create the spell object
                const spell = {
                    id: Database.generateUUID(),
                    name,
                    level,
                    school,
                    castingTime: metaProperties.castingtime || '',
                    range: metaProperties.range || '',
                    components: metaProperties.components || '',
                    duration: metaProperties.duration || '',
                    description,
                    higherLevels,
                    classes,
                    // Include the original level/school text for display
                    levelSchool
                };
                
                spells.push(spell);
                
            } catch (error) {
                console.error('Error parsing spell block:', error);
                // Continue with next spell even if there's an error
            }
        }
        
        console.log(`Total spells parsed: ${spells.length} out of ${spellCount}`);
        return spells;
    };
    
    /**
     * Parse markdown file content
     * @param {string} fileContent - File content
     * @returns {Object} Object with parsed data
     */
    const parseMarkdownFile = (fileContent) => {
        console.log('Parsing markdown file, content length:', fileContent.length);
        
        // Try to determine if it's a beast or spell file
        // Check if it contains the beast separator
        if (fileContent.includes('___') && fileContent.includes('>##')) {
            console.log('Detected beast content');
            const beasts = parseBeastMarkdown(fileContent);
            console.log(`Parsed ${beasts.length} beasts`);
            return { type: 'beasts', data: beasts };
        }
        
        // Check if it contains spell headers (look for #### headers)
        if (fileContent.includes('#### ')) {
            console.log('Detected spell content');
            const spells = parseSpellMarkdown(fileContent);
            console.log(`Parsed ${spells.length} spells`);
            return { type: 'spells', data: spells };
        }
        
        // If can't determine, try both parsers
        const beasts = parseBeastMarkdown(fileContent);
        if (beasts.length > 0) {
            console.log(`Detected ${beasts.length} beasts after trying both parsers`);
            return { type: 'beasts', data: beasts };
        }
        
        const spells = parseSpellMarkdown(fileContent);
        if (spells.length > 0) {
            console.log(`Detected ${spells.length} spells after trying both parsers`);
            return { type: 'spells', data: spells };
        }
        
        // If no data was parsed successfully
        console.warn('Failed to parse any content as beasts or spells');
        return { type: 'unknown', data: [] };
    };
    
    /**
     * Render markdown to HTML
     * @param {string} markdown - Markdown content
     * @returns {string} HTML content
     */
    const renderMarkdown = (markdown) => {
        if (!markdown) return '';
        
        // Replace headers
        let html = markdown
            .replace(/^##### (.*?)$/gm, '<h5>$1</h5>')
            .replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        
        // Replace emphasis/strong
        html = html
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Replace lists
        html = html
            .replace(/^- (.*?)$/gm, '<li>$1</li>')
            .replace(/(?:^<li>.*<\/li>\n)+/gm, '<ul>$&</ul>');
        
        // Replace tables
        // This is a simplified approach - a full parser would be more complex
        html = html.replace(/^(\|.*\|)$/gm, '<div class="table-row">$1</div>');
        html = html.replace(/\|([^|]*)\|/g, '<div class="table-cell">$1</div>');
        html = html.replace(/(?:^<div class="table-row">.*<\/div>\n)+/gm, '<div class="table">$&</div>');
        
        // Replace links
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        
        // Replace paragraphs (any consecutive lines that aren't already wrapped in HTML tags)
        html = html.replace(/^(?!<[a-z]+>)(.*?)(?!<\/[a-z]+>)$/gm, '<p>$1</p>');
        
        return html;
    };
    
    // Public API
    return {
        parseBeastMarkdown,
        parseSpellMarkdown,
        parseMarkdownFile,
        renderMarkdown
    };
})();