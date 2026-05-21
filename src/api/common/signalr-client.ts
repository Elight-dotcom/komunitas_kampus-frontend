import * as signalR from "@microsoft/signalr";

export function createSignalRConnection(hubUrl: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .build();
}