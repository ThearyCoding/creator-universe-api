import axios from "axios";

export interface FacebookUserData {
  id: string;
  name: string;
  email?: string;
}

export const verifyFacebookToken = async (
  accessToken: string
): Promise<FacebookUserData | null> => {
  try {
    const fields = "id,name,email";
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=${fields}&access_token=${accessToken}`
    );
    const data = response.data;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
    };
  } catch (error: any) {
    console.error(
      "Facebook token verification failed:",
      error.response?.data || error.message
    );
    return null;
  }
};
