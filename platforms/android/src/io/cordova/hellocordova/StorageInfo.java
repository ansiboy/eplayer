package io.cordova.hellocordova;

/* compiled from: EPlayer */
class StorageInfo {
    public boolean isRemoveable;
    public String path;
    public String state;

    public StorageInfo(String path) {
        this.path = path;
    }

    public boolean isMounted() {
        return "mounted".equals(this.state);
    }
}
