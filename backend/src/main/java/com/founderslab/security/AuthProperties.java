package com.founderslab.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@ConfigurationProperties(prefix = "founderslab.auth")
public class AuthProperties {

    private String emailAllowlist = "";

    public String getEmailAllowlist() {
        return emailAllowlist;
    }

    public void setEmailAllowlist(String emailAllowlist) {
        this.emailAllowlist = emailAllowlist;
    }

    public Set<String> allowedEmails() {
        if (emailAllowlist == null || emailAllowlist.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(emailAllowlist.split(","))
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }
}
