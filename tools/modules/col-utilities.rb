module ColUtilities
    def self.getCollections(directory)
        folders = Dir.entries(directory).select do |entry|
          File.directory?(File.join(directory, entry)) && entry.start_with?("_")
        end
        return folders
    end
    
    def self.getYMLSection(file, section)
        data = YAML.load(File.read(file))
        sectionData = data[section]
        return sectionData
    end
    
    def self.getFilesNo(folder_path)
        file_count = 0
    
        Dir.foreach(folder_path) do |entry|
            next if entry == "." || entry == ".."
    
                full_path = File.join(folder_path, entry)
    
                if File.directory?(full_path) 
                    file_count += getFilesNo(full_path)
                elsif File.file?(full_path) 
                    file_count += 1
                end
            end
        return file_count
    end

    def self.getOnStorageCollections(rootDir)
        doc_contents_folder = rootDir + "/doc-contents"
        collections = getCollections(doc_contents_folder)
        realCollections = []
        collections.each do |item|
            collectionPath = doc_contents_folder + "/" + item
            if (getFilesNo(collectionPath) > 0)
                realCollections.push(item.slice(1..-1))
            end
        end
        return realCollections
    end

    def self.checkCollections(wDir, onStorageCol, onThemeCol, onJekyllCol)
        onStorageCol.each do |collection|
            collectionDir = wDir + '/doc-contents/_' + collection
            puts Collection.new(collectionDir, collection, getFilesNo(collectionDir), onThemeCol, onJekyllCol).status
        end
    end
end

class Collection
    def initialize (collectionDir, onStorageName, filesNo, onThemeCol, onJekyllCol)
        @storageName = onStorageName
        @themeCol = onThemeCol
        @jekyllCol = onJekyllCol
        @filesNo = filesNo
        @dir  = collectionDir
        @status = setStatus(@storageName, @filesNo, @dir, @themeCol, @jekyllCol)
    end

    # access to status prop should be defined because we want to get the status as <class_instance>.status
    # otherwise is not needed to define this kind of access methods to props
    def status
        @status
    end

    def setStatus(storageColName, noFiles, colDir, themeCol, jekyllCol)
        status = {}
        status["colName"] = storageColName
        status["colNoFiles"] = noFiles
        status["colDir"] = colDir
        status["checkInTheme"] = themeCol.count(storageColName)
        status["checkInJekyll"] = jekyllCol.count(storageColName)
        return status
    end    
end